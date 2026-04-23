const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const fetchDocument = async (documentId) => {
  const res = await fetch(`${BASE_URL}/api/documents/${documentId}`);
  if (!res.ok) throw new Error("Failed to fetch document");
  return res.json();
};

export const createDocument = async () => {
  const res = await fetch(`${BASE_URL}/api/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to create document");
  return res.json();
};

export const listDocuments = async () => {
  const res = await fetch(`${BASE_URL}/api/documents`);
  if (!res.ok) throw new Error("Failed to list documents");
  return res.json();
};

export const updateDocumentTitle = async (documentId, title) => {
  const res = await fetch(`${BASE_URL}/api/documents/${documentId}/title`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to update title");
  return res.json();
};