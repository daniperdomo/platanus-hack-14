const KEYS = {
  draft: "zeroid.draft",
};

let documentFile = null;

function readDraft() {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(KEYS.draft);
  return raw ? JSON.parse(raw) : null;
}

export function saveDocumentDraft({ nationality, documentType, file }) {
  documentFile = file;
  window.sessionStorage.setItem(
    KEYS.draft,
    JSON.stringify({
      nationality,
      documentType,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    })
  );
}

export function loadDocumentDraft() {
  const draft = readDraft();
  if (!draft || !documentFile) return null;
  return { ...draft, file: documentFile };
}

export function clearDocumentDraft() {
  documentFile = null;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(KEYS.draft);
  }
}
