const { EVENTS } = require("./config/constants");

// In-memory store for active documents
// Structure: { documentId: { content: "", users: Map } }
// NOTE: This is temporary — Phase 6 replaces this with MongoDB
const activeDocuments = new Map();

// Assign a random color to each user's cursor
const CURSOR_COLORS = [
  "#F87171", // red
  "#FB923C", // orange
  "#FBBF24", // yellow
  "#34D399", // green
  "#60A5FA", // blue
  "#A78BFA", // purple
  "#F472B6", // pink
  "#22D3EE", // cyan
];

const getRandomColor = () =>
  CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // -------------------------------------------------
    // JOIN DOCUMENT
    // Fired when a user opens a document
    // -------------------------------------------------
    socket.on(EVENTS.JOIN_DOCUMENT, ({ documentId, userName }) => {
      // Leave any previous document room
      if (socket.currentDocumentId) {
        socket.leave(socket.currentDocumentId);
        handleUserLeave(io, socket);
      }

      // Join the new room
      socket.join(documentId);
      socket.currentDocumentId = documentId;
      socket.userName = userName || "Anonymous";
      socket.userColor = getRandomColor();

      // Initialize document in memory if first user
      if (!activeDocuments.has(documentId)) {
        activeDocuments.set(documentId, {
          content: "",
          users: new Map(),
        });
      }

      const doc = activeDocuments.get(documentId);

      // Register this user
      doc.users.set(socket.id, {
        id: socket.id,
        name: socket.userName,
        color: socket.userColor,
        cursor: null,
      });

      // Send the current document state to the joining user only
      socket.emit(EVENTS.DOCUMENT_STATE, {
        content: doc.content,
      });

      // Broadcast updated user list to everyone in the room
      broadcastUsers(io, documentId, doc);

      console.log(
        `[Socket] ${socket.userName} joined document: ${documentId}`
      );
    });

    // -------------------------------------------------
    // DOCUMENT CHANGE
    // Fired when a user types or edits
    // -------------------------------------------------
    socket.on(EVENTS.DOCUMENT_CHANGE, ({ documentId, content }) => {
      const doc = activeDocuments.get(documentId);
      if (!doc) return;

      // Update stored content (last-write-wins for now)
      doc.content = content;

      // Broadcast to everyone in the room EXCEPT the sender
      socket.to(documentId).emit(EVENTS.DOCUMENT_CHANGE, { content });
    });

    // -------------------------------------------------
    // CURSOR MOVE
    // Fired when a user's cursor position changes
    // -------------------------------------------------
    socket.on(EVENTS.CURSOR_MOVE, ({ documentId, cursor }) => {
      const doc = activeDocuments.get(documentId);
      if (!doc) return;

      const user = doc.users.get(socket.id);
      if (!user) return;

      // Update cursor position for this user
      user.cursor = cursor;

      // Broadcast all cursors to everyone in the room
      const cursors = Array.from(doc.users.values()).filter(
        (u) => u.id !== socket.id && u.cursor !== null
      );

      socket.to(documentId).emit(EVENTS.CURSORS_UPDATE, {
        cursors: Array.from(doc.users.values()),
      });
    });

    // -------------------------------------------------
    // DISCONNECT
    // -------------------------------------------------
    socket.on("disconnect", () => {
      handleUserLeave(io, socket);
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
};

// Helper: remove user and notify room
const handleUserLeave = (io, socket) => {
  const documentId = socket.currentDocumentId;
  if (!documentId) return;

  const doc = activeDocuments.get(documentId);
  if (!doc) return;

  doc.users.delete(socket.id);

  // Clean up doc from memory if no users left
  if (doc.users.size === 0) {
    activeDocuments.delete(documentId);
  } else {
    broadcastUsers(io, documentId, doc);
  }
};

// Helper: send user list to entire room
const broadcastUsers = (io, documentId, doc) => {
  const users = Array.from(doc.users.values());
  io.to(documentId).emit(EVENTS.USERS_UPDATE, { users });
};

module.exports = { initializeSocket };