const Document = require("../models/Document");

/**
 * Load a document from MongoDB.
 * If it doesn't exist yet, create it (upsert pattern).
 */
const loadDocument = async (documentId, ownerId = null) => {
  try {
    let doc = await Document.findOne({ documentId, isDeleted: false });

    if (!doc) {
      doc = await Document.create({
        documentId,
        title: "Untitled Document",
        content: "",
        version: 0,
        ...(ownerId && { ownerId }),
      });
      console.log(`[DB] Created new document: ${documentId}`);
    }

    return doc;
  } catch (error) {
    console.error(`[DB] Failed to load document ${documentId}:`, error.message);
    throw error;
  }
};

/**
 * Save document content + version to MongoDB.
 * Called by the debounced auto-save in socket.js.
 */
const saveDocument = async (documentId, { content, version, title }) => {
  try {
    const updated = await Document.findOneAndUpdate(
      { documentId },
      {
        ...(content !== undefined && { content }),
        ...(version !== undefined && { version }),
        ...(title !== undefined && { title }),
      },
      {
        new: true,          // return the updated document
        upsert: true,       // create if doesn't exist
        runValidators: true,
      }
    );

    return updated;
  } catch (error) {
    console.error(`[DB] Failed to save document ${documentId}:`, error.message);
    throw error;
  }
};

/**
 * List all documents (will be filtered by ownerId in Phase 6).
 */
const listDocuments = async (ownerId = null) => {
  try {
    const query = { isDeleted: false };
    if (ownerId) query.ownerId = ownerId;

    const docs = await Document.find(query)
      .select("documentId title version updatedAt createdAt")
      .sort({ updatedAt: -1 })
      .limit(50);

    return docs;
  } catch (error) {
    console.error("[DB] Failed to list documents:", error.message);
    throw error;
  }
};

/**
 * Update just the document title.
 */
const updateTitle = async (documentId, title) => {
  try {
    return await Document.findOneAndUpdate(
      { documentId },
      { title },
      { new: true }
    );
  } catch (error) {
    console.error(`[DB] Failed to update title for ${documentId}:`, error.message);
    throw error;
  }
};

module.exports = { loadDocument, saveDocument, listDocuments, updateTitle };