const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const fetchDocument = async (documentId) => {
  const res = await fetch(`${BASE_URL}/api/documents/${documentId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch document");
  return res.json();
};

export const createDocument = async () => {
  const res = await fetch(`${BASE_URL}/api/documents`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to create document");
  return res.json();
};

export const listDocuments = async () => {
  const res = await fetch(`${BASE_URL}/api/documents`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to list documents");
  return res.json();
};

export const updateDocumentTitle = async (documentId, title) => {
  const res = await fetch(`${BASE_URL}/api/documents/${documentId}/title`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to update title");
  return res.json();
};

export const deleteDocument = async (documentId) => {
  const res = await fetch(`${BASE_URL}/api/documents/${documentId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete document");
  return res.json();
};