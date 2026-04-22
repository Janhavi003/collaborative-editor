const EVENTS = {
  // Connection
  JOIN_DOCUMENT: "join-document",
  LEAVE_DOCUMENT: "leave-document",

  // Document changes (upgraded)
  OPERATION: "operation",              // a single insert/delete op
  OPERATIONS_ACK: "operation-ack",    // server confirms op was applied
  DOCUMENT_STATE: "document-state",

  // Cursors
  CURSOR_MOVE: "cursor-move",
  CURSORS_UPDATE: "cursors-update",

  // Users
  USERS_UPDATE: "users-update",
};

const OP_TYPES = {
  INSERT: "insert",
  DELETE: "delete",
  REPLACE: "replace",   // full replace — fallback for rich text formatting
};

module.exports = { EVENTS, OP_TYPES };