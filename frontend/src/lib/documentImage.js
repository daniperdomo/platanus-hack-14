export const MAX_FILE_BYTES = 10 * 1024 * 1024;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No pudimos abrir la imagen. Prueba con una foto JPG o PNG."));
    };
    image.src = url;
  });
}

export async function validateDocumentImage(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("La imagen pesa más de 10 MB.");
  }

  await loadImage(file);
}
