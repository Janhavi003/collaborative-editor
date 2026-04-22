// Socket event names — single source of truth
// We define them here so frontend + backend use identical strings
const EVENTS = {
  // Connection
  JOIN_DOCUMENT: "join-document",
  LEAVE_DOCUMENT: "leave-document",

  // Document changes
  DOCUMENT_CHANGE: "document-change",
  DOCUMENT_STATE: "document-state",

  // Cursors
  CURSOR_MOVE: "cursor-move",
  CURSORS_UPDATE: "cursors-update",

  // Users
  USERS_UPDATE: "users-update",
};

module.exports = { EVENTS };