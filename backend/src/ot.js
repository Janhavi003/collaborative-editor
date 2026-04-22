const { OP_TYPES } = require("./config/constants");

/**
 * OPERATIONAL TRANSFORMATION ENGINE
 *
 * Core idea: when two operations happen concurrently (before either
 * user has seen the other's change), we transform one against the
 * other so both can be applied without conflict.
 *
 * We track this with a "version" number — a simple counter of how
 * many operations have been applied to a document. Each client sends
 * its local version with every operation. If the server's version is
 * ahead, we know a concurrent edit happened and must transform.
 */

/**
 * Transform operation `a` against operation `b`.
 * Returns a new version of `a` that can be applied AFTER `b`.
 */
const transformAgainst = (a, b) => {
  // Only insert/delete need position transformation
  // REPLACE ops (rich text formatting) don't have positions
  if (a.type === OP_TYPES.REPLACE || b.type === OP_TYPES.REPLACE) {
    return a; // formatting ops are idempotent — no transform needed
  }

  let newPosition = a.position;

  if (b.type === OP_TYPES.INSERT) {
    if (b.position <= a.position) {
      // b inserted BEFORE a's position → shift a forward
      newPosition += b.text.length;
    }
    // b inserted AFTER a's position → no change needed
  }

  if (b.type === OP_TYPES.DELETE) {
    if (b.position < a.position) {
      if (b.position + b.length <= a.position) {
        // b deleted entirely before a → shift a backward
        newPosition -= b.length;
      } else {
        // b's deletion overlaps a's position → place a at deletion start
        newPosition = b.position;
      }
    }
    // b deleted after a's position → no change needed
  }

  return { ...a, position: newPosition };
};

/**
 * Apply an operation to a plain text string.
 * Used server-side to maintain a plain-text shadow for OT calculations.
 * (The actual rich HTML is stored separately.)
 */
const applyOperation = (text, op) => {
  if (op.type === OP_TYPES.INSERT) {
    return (
      text.slice(0, op.position) +
      op.text +
      text.slice(op.position)
    );
  }

  if (op.type === OP_TYPES.DELETE) {
    return (
      text.slice(0, op.position) +
      text.slice(op.position + op.length)
    );
  }

  if (op.type === OP_TYPES.REPLACE) {
    // Full content replace — just return the new content
    return op.content;
  }

  return text;
};

/**
 * Given a client operation and a list of server operations the client
 * hasn't seen yet, transform the client op through all of them.
 *
 * This is the function called when the server receives an op from a
 * client that is "behind" the current server version.
 */
const transformOperation = (clientOp, missedOps) => {
  let transformed = { ...clientOp };

  for (const serverOp of missedOps) {
    // Don't transform against ops from the same client
    // (the client already knows about its own ops)
    if (serverOp.clientId === clientOp.clientId) continue;
    transformed = transformAgainst(transformed, serverOp);
  }

  return transformed;
};

module.exports = { transformOperation, applyOperation, transformAgainst };