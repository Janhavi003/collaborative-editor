const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { requireAuth } = require("../middleware/auth");
const {
  loadDocument,
  listDocuments,
  updateTitle,
  saveDocument,
} = require("../services/documentService");

// All routes below require authentication
router.use(requireAuth);

// GET /api/documents — list this user's documents
router.get("/", async (req, res) => {
  try {
    const docs = await listDocuments(req.user.id);
    res.json({ success: true, documents: docs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/documents — create a new document owned by this user
router.post("/", async (req, res) => {
  try {
    const documentId = `doc-${uuidv4().slice(0, 8)}`;
    const doc = await loadDocument(documentId, req.user.id);
    res.status(201).json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/documents/:documentId
router.get("/:documentId", async (req, res) => {
  try {
    const doc = await loadDocument(req.params.documentId);
    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/documents/:documentId/title
router.patch("/:documentId/title", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });
    const doc = await updateTitle(req.params.documentId, title);
    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;