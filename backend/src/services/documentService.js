const Document = require("../models/Document");

/**
 * --------------------------------------------------
 * Load a document from MongoDB
 * Creates it if it doesn't exist
 * --------------------------------------------------
 */
const loadDocument = async (
  documentId,
  ownerId = null
) => {
  try {
    /**
     * Build secure query
     */
    const query = {
      documentId,
      isDeleted: false,
    };

    // Enforce ownership if provided
    if (ownerId) {
      query.ownerId = ownerId;
    }

    let doc = await Document.findOne(query);

    /**
     * Create new doc if missing
     */
    if (!doc) {
      doc = await Document.create({
        documentId,
        title: "Untitled Document",
        content: "",
        version: 0,
        ...(ownerId && { ownerId }),
      });

      console.log(
        `[DB] Created new document: ${documentId}`
      );
    }

    return doc;
  } catch (error) {
    console.error(
      `[DB] Failed to load document ${documentId}:`,
      error.message
    );

    throw error;
  }
};

/**
 * --------------------------------------------------
 * Save document content/version/title
 * --------------------------------------------------
 */
const saveDocument = async (
  documentId,
  {
    content,
    version,
    title,
  }
) => {
  try {
    const updated = await Document.findOneAndUpdate(
      { documentId },
      {
        ...(content !== undefined && { content }),
        ...(version !== undefined && { version }),
        ...(title !== undefined && { title }),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return updated;
  } catch (error) {
    console.error(
      `[DB] Failed to save document ${documentId}:`,
      error.message
    );

    throw error;
  }
};

/**
 * --------------------------------------------------
 * List documents for owner
 * --------------------------------------------------
 */
const listDocuments = async (ownerId = null) => {
  try {
    const query = {
      isDeleted: false,
    };

    if (ownerId) {
      query.ownerId = ownerId;
    }

    const docs = await Document.find(query)
      .select(
        "documentId title content version updatedAt createdAt"
      )
      .sort({ updatedAt: -1 })
      .limit(50);

    return docs;
  } catch (error) {
    console.error(
      "[DB] Failed to list documents:",
      error.message
    );

    throw error;
  }
};

/**
 * --------------------------------------------------
 * Update document title
 * --------------------------------------------------
 */
const updateTitle = async (
  documentId,
  ownerId,
  title
) => {
  try {
    const doc = await Document.findOneAndUpdate(
      {
        documentId,
        ownerId,
        isDeleted: false,
      },
      {
        title,
      },
      {
        new: true,
      }
    );

    if (!doc) {
      throw new Error(
        "Document not found or access denied"
      );
    }

    return doc;
  } catch (error) {
    console.error(
      `[DB] Failed to update title for ${documentId}:`,
      error.message
    );

    throw error;
  }
};

/**
 * --------------------------------------------------
 * Soft delete document
 * --------------------------------------------------
 */
const deleteDocument = async (
  documentId,
  ownerId
) => {
  try {
    const doc = await Document.findOneAndUpdate(
      {
        documentId,
        ownerId,
        isDeleted: false,
      },
      {
        isDeleted: true,
      },
      {
        new: true,
      }
    );

    if (!doc) {
      throw new Error(
        "Document not found or access denied"
      );
    }

    return doc;
  } catch (error) {
    console.error(
      `[DB] Failed to delete document ${documentId}:`,
      error.message
    );

    throw error;
  }
};

module.exports = {
  loadDocument,
  saveDocument,
  listDocuments,
  updateTitle,
  deleteDocument,
};