const express = require("express");
const router = express.Router();

const { v4: uuidv4 } = require("uuid");

const { requireAuth } = require("../middleware/auth");

const {
  loadDocument,
  listDocuments,
  updateTitle,
  deleteDocument,
} = require("../services/documentService");

/**
 * --------------------------------------------------
 * All routes require authentication
 * --------------------------------------------------
 */
router.use(requireAuth);

/**
 * --------------------------------------------------
 * GET /api/documents
 * List current user's documents
 * --------------------------------------------------
 */
router.get("/", async (req, res) => {
  try {
    const docs = await listDocuments(req.user.id);

    res.json({
      success: true,
      documents: docs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * --------------------------------------------------
 * POST /api/documents
 * Create a new document
 * --------------------------------------------------
 */
router.post("/", async (req, res) => {
  try {
    const documentId = `doc-${uuidv4().slice(0, 8)}`;

    const doc = await loadDocument(
      documentId,
      req.user.id
    );

    res.status(201).json({
      success: true,
      document: doc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * --------------------------------------------------
 * GET /api/documents/:documentId
 * Load a single document
 * --------------------------------------------------
 */
router.get("/:documentId", async (req, res) => {
  try {
    const doc = await loadDocument(
      req.params.documentId,
      req.user.id
    );

    res.json({
      success: true,
      document: doc,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * --------------------------------------------------
 * PATCH /api/documents/:documentId/title
 * Update document title
 * --------------------------------------------------
 */
router.patch("/:documentId/title", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Title is required",
      });
    }

    const doc = await updateTitle(
      req.params.documentId,
      req.user.id,
      title.trim()
    );

    res.json({
      success: true,
      document: doc,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * --------------------------------------------------
 * DELETE /api/documents/:documentId
 * Soft delete
 * --------------------------------------------------
 */
router.delete("/:documentId", async (req, res) => {
  try {
    await deleteDocument(
      req.params.documentId,
      req.user.id
    );

    res.json({
      success: true,
      message: "Document deleted",
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;