import { dataUrlToFile, fileToDataUrl } from "./image";

const KEYS = {
  draft: "zeroid.draft",
};

export async function saveDocumentDraft({ nationality, documentType, file }) {
  const dataUrl = await fileToDataUrl(file);
  window.sessionStorage.setItem(
    KEYS.draft,
    JSON.stringify({ nationality, documentType, fileName: file.name, dataUrl })
  );
}

export async function loadDocumentDraft() {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(KEYS.draft);
  if (!raw) return null;

  const { dataUrl, fileName, ...draft } = JSON.parse(raw);
  return { ...draft, file: await dataUrlToFile(dataUrl, fileName) };
}

export function clearDocumentDraft() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(KEYS.draft);
  }
}
