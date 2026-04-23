const { EVENTS, OP_TYPES } = require("./config/constants");
const { transformOperation, applyOperation } = require("./ot");
const { loadDocument, saveDocument } = require("./services/documentService");

const activeDocuments = new Map();
const saveTimers = new Map(); // debounce auto-save per document

const CURSOR_COLORS = [
  "#F87171", "#FB923C", "#FBBF24", "#34D399",
  "#60A5FA", "#A78BFA", "#F472B6", "#22D3EE",
];
const getRandomColor = () =>
  CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];

const AUTOSAVE_DELAY = parseInt(process.env.AUTOSAVE_DEBOUNCE_MS) || 2000;

// --------------------------------------------------
// Auto-save: debounced write to MongoDB
// --------------------------------------------------
const scheduleSave = (documentId) => {
  // Clear existing timer for this doc
  if (saveTimers.has(documentId)) {
    clearTimeout(saveTimers.get(documentId));
  }

  const timer = setTimeout(async () => {
    const doc = activeDocuments.get(documentId);
    if (!doc) return;

    try {
      await saveDocument(documentId, {
        content: doc.richContent,
        version: doc.version,
      });
      console.log(
        `[AutoSave] Saved document ${documentId} at version ${doc.version}`
      );
    } catch (err) {
      console.error(`[AutoSave] Failed to save ${documentId}:`, err.message);
    }

    saveTimers.delete(documentId);
  }, AUTOSAVE_DELAY);

  saveTimers.set(documentId, timer);
};

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // --------------------------------------------------
    // JOIN DOCUMENT — now loads from MongoDB
    // --------------------------------------------------
    socket.on(EVENTS.JOIN_DOCUMENT, async ({ documentId, userName }) => {
      if (socket.currentDocumentId) {
        socket.leave(socket.currentDocumentId);
        handleUserLeave(io, socket);
      }

      socket.join(documentId);
      socket.currentDocumentId = documentId;
      socket.userName = userName || "Anonymous";
      socket.userColor = getRandomColor();

      // Load from DB if not already in memory
      if (!activeDocuments.has(documentId)) {
        try {
          const dbDoc = await loadDocument(documentId);

          activeDocuments.set(documentId, {
            content: dbDoc.content || "",
            richContent: dbDoc.content || "",
            version: dbDoc.version || 0,
            history: [],
            users: new Map(),
          });

          console.log(
            `[Socket] Loaded doc ${documentId} from DB ` +
            `(version ${dbDoc.version})`
          );
        } catch (err) {
          console.error(`[Socket] Failed to load doc ${documentId}:`, err.message);
          socket.emit("error", { message: "Failed to load document" });
          return;
        }
      }

      const doc = activeDocuments.get(documentId);

      doc.users.set(socket.id, {
        id: socket.id,
        name: socket.userName,
        color: socket.userColor,
        cursor: null,
      });

      // Send persisted content to joining user
      socket.emit(EVENTS.DOCUMENT_STATE, {
        content: doc.richContent,
        version: doc.version,
      });

      broadcastUsers(io, documentId, doc);

      console.log(`[Socket] ${socket.userName} joined: ${documentId}`);
    });

    // --------------------------------------------------
    // OPERATION — OT + auto-save
    // --------------------------------------------------
    socket.on(EVENTS.OPERATION, ({ documentId, operation }) => {
      const doc = activeDocuments.get(documentId);
      if (!doc) return;

      operation.clientId = socket.id;

      let transformedOp = operation;

      if (operation.version < doc.version) {
        const missedOps = doc.history.slice(operation.version);
        console.log(
          `[OT] Transforming op from ${socket.userName}. ` +
          `Client: ${operation.version}, Server: ${doc.version}, ` +
          `Missed: ${missedOps.length}`
        );
        transformedOp = transformOperation(operation, missedOps);
        transformedOp.wasTransformed = true;
      }

      // Apply to in-memory doc
      if (operation.type === OP_TYPES.REPLACE) {
        doc.richContent = transformedOp.content;
        doc.content = transformedOp.content;
      } else {
        doc.content = applyOperation(doc.content, transformedOp);
        doc.richContent = transformedOp.richContent || doc.richContent;
      }

      doc.version += 1;
      transformedOp.serverVersion = doc.version;
      doc.history.push(transformedOp);

      if (doc.history.length > 100) {
        doc.history = doc.history.slice(-100);
      }

      // Schedule a debounced save to MongoDB
      scheduleSave(documentId);

      socket.emit(EVENTS.OPERATIONS_ACK, {
        clientOpId: operation.id,
        serverVersion: doc.version,
        wasTransformed: transformedOp.wasTransformed || false,
      });

      socket.to(documentId).emit(EVENTS.OPERATION, {
        operation: transformedOp,
        serverVersion: doc.version,
      });
    });

    // --------------------------------------------------
    // CURSOR MOVE
    // --------------------------------------------------
    socket.on(EVENTS.CURSOR_MOVE, ({ documentId, cursor }) => {
      const doc = activeDocuments.get(documentId);
      if (!doc) return;

      const user = doc.users.get(socket.id);
      if (!user) return;

      user.cursor = cursor;

      socket.to(documentId).emit(EVENTS.CURSORS_UPDATE, {
        cursors: Array.from(doc.users.values()),
      });
    });

    // --------------------------------------------------
    // DISCONNECT
    // --------------------------------------------------
    socket.on("disconnect", () => {
      handleUserLeave(io, socket);
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
};

const handleUserLeave = (io, socket) => {
  const documentId = socket.currentDocumentId;
  if (!documentId) return;

  const doc = activeDocuments.get(documentId);
  if (!doc) return;

  doc.users.delete(socket.id);

  if (doc.users.size === 0) {
    // Final save before evicting from memory
    scheduleSave(documentId);
    activeDocuments.delete(documentId);
  } else {
    broadcastUsers(io, documentId, doc);
  }
};

const broadcastUsers = (io, documentId, doc) => {
  io.to(documentId).emit(EVENTS.USERS_UPDATE, {
    users: Array.from(doc.users.values()),
  });
};

module.exports = { initializeSocket };