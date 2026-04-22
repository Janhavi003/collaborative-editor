const { EVENTS, OP_TYPES } = require("./config/constants");
const { transformOperation, applyOperation } = require("./ot");

const activeDocuments = new Map();

const CURSOR_COLORS = [
  "#F87171", "#FB923C", "#FBBF24", "#34D399",
  "#60A5FA", "#A78BFA", "#F472B6", "#22D3EE",
];
const getRandomColor = () =>
  CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // --------------------------------------------------
    // JOIN DOCUMENT
    // --------------------------------------------------
    socket.on(EVENTS.JOIN_DOCUMENT, ({ documentId, userName }) => {
      if (socket.currentDocumentId) {
        socket.leave(socket.currentDocumentId);
        handleUserLeave(io, socket);
      }

      socket.join(documentId);
      socket.currentDocumentId = documentId;
      socket.userName = userName || "Anonymous";
      socket.userColor = getRandomColor();

      if (!activeDocuments.has(documentId)) {
        activeDocuments.set(documentId, {
          content: "",          // plain text shadow for OT
          richContent: "",      // full HTML content
          version: 0,           // operation counter
          history: [],          // all applied operations (for transforms)
          users: new Map(),
        });
      }

      const doc = activeDocuments.get(documentId);

      doc.users.set(socket.id, {
        id: socket.id,
        name: socket.userName,
        color: socket.userColor,
        cursor: null,
      });

      // Send full current state to the joining user
      socket.emit(EVENTS.DOCUMENT_STATE, {
        content: doc.richContent,
        version: doc.version,
      });

      broadcastUsers(io, documentId, doc);

      console.log(`[Socket] ${socket.userName} joined: ${documentId}`);
    });

    // --------------------------------------------------
    // OPERATION (replaces DOCUMENT_CHANGE)
    // --------------------------------------------------
    socket.on(EVENTS.OPERATION, ({ documentId, operation }) => {
      const doc = activeDocuments.get(documentId);
      if (!doc) return;

      // Attach the client's socket ID so we can skip self-transforms
      operation.clientId = socket.id;

      let transformedOp = operation;

      // Has the server moved ahead since this client last synced?
      if (operation.version < doc.version) {
        // Get all ops the client hasn't seen
        const missedOps = doc.history.slice(operation.version);

        console.log(
          `[OT] Transforming op from ${socket.userName}. ` +
          `Client version: ${operation.version}, Server version: ${doc.version}. ` +
          `Missed ops: ${missedOps.length}`
        );

        transformedOp = transformOperation(operation, missedOps);
        transformedOp.wasTransformed = true;
      }

      // Apply the (possibly transformed) operation
      if (operation.type === OP_TYPES.REPLACE) {
        // Rich text formatting change — update full HTML
        doc.richContent = transformedOp.content;
        doc.content = transformedOp.content; // simplified
      } else {
        doc.content = applyOperation(doc.content, transformedOp);
        doc.richContent = transformedOp.richContent || doc.richContent;
      }

      // Increment version and record in history
      doc.version += 1;
      transformedOp.serverVersion = doc.version;
      doc.history.push(transformedOp);

      // Keep history bounded (last 100 ops)
      if (doc.history.length > 100) {
        doc.history = doc.history.slice(-100);
      }

      // ACK back to the sender with the new server version
      socket.emit(EVENTS.OPERATIONS_ACK, {
        clientOpId: operation.id,
        serverVersion: doc.version,
        wasTransformed: transformedOp.wasTransformed || false,
      });

      // Broadcast transformed op to all OTHER users
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
    activeDocuments.delete(documentId);
  } else {
    broadcastUsers(io, documentId, doc);
  }
};

const broadcastUsers = (io, documentId, doc) => {
  const users = Array.from(doc.users.values());
  io.to(documentId).emit(EVENTS.USERS_UPDATE, { users });
};

module.exports = { initializeSocket };