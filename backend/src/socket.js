const { EVENTS, OP_TYPES } = require("./config/constants");
const { transformOperation, applyOperation } = require("./ot");
const {
  loadDocument,
  saveDocument,
} = require("./services/documentService");

const activeDocuments = new Map();
const saveTimers = new Map();

const CURSOR_COLORS = [
  "#F87171",
  "#FB923C",
  "#FBBF24",
  "#34D399",
  "#60A5FA",
  "#A78BFA",
  "#F472B6",
  "#22D3EE",
];

const getRandomColor = () =>
  CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];

const AUTOSAVE_DELAY =
  parseInt(process.env.AUTOSAVE_DEBOUNCE_MS) || 2000;

/**
 * --------------------------------------------------
 * Debounced auto-save to MongoDB
 * --------------------------------------------------
 */
const scheduleSave = (documentId) => {
  // Clear previous timer
  if (saveTimers.has(documentId)) {
    clearTimeout(saveTimers.get(documentId));
  }

  const timer = setTimeout(async () => {
    const doc = activeDocuments.get(documentId);

    // Doc may already be evicted
    if (!doc) {
      saveTimers.delete(documentId);
      return;
    }

    try {
      await saveDocument(documentId, {
        content: doc.richContent,
        version: doc.version,
      });

      console.log(
        `[AutoSave] Saved document ${documentId} at version ${doc.version}`
      );
    } catch (err) {
      console.error(
        `[AutoSave] Failed to save ${documentId}:`,
        err.message
      );
    }

    saveTimers.delete(documentId);
  }, AUTOSAVE_DELAY);

  saveTimers.set(documentId, timer);
};

/**
 * --------------------------------------------------
 * Socket.IO Initialization
 * --------------------------------------------------
 */
const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    /**
     * --------------------------------------------------
     * JOIN DOCUMENT
     * --------------------------------------------------
     */
    socket.on(EVENTS.JOIN_DOCUMENT, async ({ documentId, userName }) => {
      try {
        /**
         * Leave previous document safely
         */
        if (socket.currentDocumentId) {
          const previousDocumentId = socket.currentDocumentId;

          socket.leave(previousDocumentId);

          handleUserLeave(io, socket, previousDocumentId);
        }

        /**
         * Join new room
         */
        socket.join(documentId);

        socket.currentDocumentId = documentId;
        socket.userName = userName || "Anonymous";
        socket.userColor = getRandomColor();

        /**
         * Optional frontend confirmation
         */
        socket.emit("connected-document", {
          documentId,
        });

        /**
         * Load document from DB if not cached
         */
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
            console.error(
              `[Socket] Failed to load doc ${documentId}:`,
              err.message
            );

            socket.emit("error", {
              message: "Failed to load document",
            });

            return;
          }
        }

        const doc = activeDocuments.get(documentId);

        /**
         * Track active user
         */
        doc.users.set(socket.id, {
          id: socket.id,
          name: socket.userName,
          color: socket.userColor,
          cursor: null,
        });

        /**
         * Send initial state
         */
        socket.emit(EVENTS.DOCUMENT_STATE, {
          content: doc.richContent,
          version: doc.version,
        });

        /**
         * Broadcast users
         */
        broadcastUsers(io, documentId, doc);

        console.log(
          `[Socket] ${socket.userName} joined: ${documentId}`
        );
      } catch (err) {
        console.error("[Socket] JOIN_DOCUMENT error:", err.message);
      }
    });

    /**
     * --------------------------------------------------
     * OPERATION
     * --------------------------------------------------
     */
    socket.on(EVENTS.OPERATION, ({ documentId, operation }) => {
      try {
        const doc = activeDocuments.get(documentId);

        if (!doc) return;

        operation.clientId = socket.id;

        let transformedOp = operation;

        /**
         * OT transform
         */
        if (operation.version < doc.version) {
          const missedOps = doc.history.slice(operation.version);

          console.log(
            `[OT] Transforming op from ${socket.userName}. ` +
              `Client: ${operation.version}, ` +
              `Server: ${doc.version}, ` +
              `Missed: ${missedOps.length}`
          );

          transformedOp = transformOperation(
            operation,
            missedOps
          );

          transformedOp.wasTransformed = true;
        }

        /**
         * Apply operation
         */
        if (operation.type === OP_TYPES.REPLACE) {
          doc.richContent = transformedOp.content;
          doc.content = transformedOp.content;
        } else {
          doc.content = applyOperation(
            doc.content,
            transformedOp
          );

          doc.richContent =
            transformedOp.richContent || doc.richContent;
        }

        /**
         * Increment version
         */
        doc.version += 1;

        transformedOp.serverVersion = doc.version;

        /**
         * Store history
         */
        doc.history.push(transformedOp);

        // Limit history size
        if (doc.history.length > 100) {
          doc.history = doc.history.slice(-100);
        }

        /**
         * Schedule DB save
         */
        scheduleSave(documentId);

        /**
         * ACK sender
         */
        socket.emit(EVENTS.OPERATIONS_ACK, {
          clientOpId: operation.id,
          serverVersion: doc.version,
          wasTransformed:
            transformedOp.wasTransformed || false,
        });

        /**
         * Broadcast to collaborators
         */
        socket.to(documentId).emit(EVENTS.OPERATION, {
          operation: transformedOp,
          serverVersion: doc.version,
        });
      } catch (err) {
        console.error("[Socket] OPERATION error:", err.message);
      }
    });

    /**
     * --------------------------------------------------
     * CURSOR MOVE
     * --------------------------------------------------
     */
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

    /**
     * --------------------------------------------------
     * DISCONNECT
     * --------------------------------------------------
     */
    socket.on("disconnect", () => {
      handleUserLeave(io, socket);

      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
};

/**
 * --------------------------------------------------
 * Handle user leaving document
 * --------------------------------------------------
 */
const handleUserLeave = async (
  io,
  socket,
  explicitDocumentId = null
) => {
  const documentId =
    explicitDocumentId || socket.currentDocumentId;

  if (!documentId) return;

  const doc = activeDocuments.get(documentId);

  if (!doc) return;

  /**
   * Remove user
   */
  doc.users.delete(socket.id);

  /**
   * No users left
   */
  if (doc.users.size === 0) {
    try {
      /**
       * Clear pending autosave timer
       */
      if (saveTimers.has(documentId)) {
        clearTimeout(saveTimers.get(documentId));
        saveTimers.delete(documentId);
      }

      /**
       * Final immediate save
       */
      await saveDocument(documentId, {
        content: doc.richContent,
        version: doc.version,
      });

      console.log(
        `[Socket] Final save completed for ${documentId}`
      );
    } catch (err) {
      console.error(
        `[Socket] Final save failed for ${documentId}:`,
        err.message
      );
    }

    /**
     * Evict from memory
     */
    activeDocuments.delete(documentId);
  } else {
    /**
     * Broadcast updated users
     */
    broadcastUsers(io, documentId, doc);
  }
};

/**
 * --------------------------------------------------
 * Broadcast active users
 * --------------------------------------------------
 */
const broadcastUsers = (io, documentId, doc) => {
  io.to(documentId).emit(EVENTS.USERS_UPDATE, {
    users: Array.from(doc.users.values()),
  });
};

module.exports = {
  initializeSocket,
};