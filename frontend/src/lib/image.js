export const MAX_LONG_SIDE = 1280;
export const DOCUMENT_LONG_SIDE = 2000;
export const JPEG_QUALITY = 0.85;

export function drawToJpeg(source, width, height, name, maxSide = MAX_LONG_SIDE) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo procesar la foto."));
          return;
        }
        resolve(new File([blob], name, { type: "image/jpeg" }));
      },
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

export async function fileToJpeg(file, name, maxSide = MAX_LONG_SIDE) {
  const bitmap = await createImageBitmap(file);
  try {
    return await drawToJpeg(bitmap, bitmap.width, bitmap.height, name, maxSide);
  } finally {
    bitmap.close();
  }
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer la foto."));
    reader.readAsDataURL(file);
  });
}

export async function dataUrlToFile(dataUrl, name) {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: blob.type });
}
