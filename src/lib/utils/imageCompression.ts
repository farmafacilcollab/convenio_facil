import imageCompression from "browser-image-compression";

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
}

/**
 * Validates that a file is an image by checking its MIME type.
 */
export function isValidImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * Compresses an image file to webp format, max 200KB, max 1024px dimension.
 */
export async function compressImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  if (!isValidImageFile(file)) {
    throw new Error("O arquivo selecionado não é uma imagem válida.");
  }

  const originalSize = file.size;

  const compressed = await imageCompression(file, {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.7,
    onProgress: (p) => onProgress?.(p),
  });

  // Rename to .webp extension
  const webpFile = new File(
    [compressed],
    file.name.replace(/\.[^.]+$/, ".webp"),
    { type: "image/webp" }
  );

  return {
    file: webpFile,
    originalSize,
    compressedSize: webpFile.size,
  };
}

/**
 * Creates an object URL for image preview. Remember to revoke when done.
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revokes an object URL to free memory.
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}
