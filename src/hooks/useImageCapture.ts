"use client";

import { useState, useCallback } from "react";
import {
  compressImage,
  createImagePreview,
  revokeImagePreview,
  isValidImageFile,
} from "@/lib/utils/imageCompression";
import type { CompressedImage } from "@/lib/types/app.types";

export function useImageCapture(imageCount: number) {
  const [images, setImages] = useState<(CompressedImage | null)[]>(
    () => Array(imageCount).fill(null)
  );
  const [compressingIndex, setCompressingIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const captureImage = useCallback(
    async (file: File, index: number) => {
      if (!isValidImageFile(file)) {
        throw new Error("O arquivo selecionado não é uma imagem válida.");
      }

      setCompressingIndex(index);
      setProgress(0);

      try {
        const result = await compressImage(file, (p) => setProgress(p));
        const preview = createImagePreview(result.file);

        const newImage: CompressedImage = {
          file: result.file,
          preview,
          installment_number: imageCount === 1 ? null : index + 1,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
        };

        setImages((prev) => {
          const updated = [...prev];
          // Revoke old preview if exists
          if (updated[index]?.preview) {
            revokeImagePreview(updated[index]!.preview);
          }
          updated[index] = newImage;
          return updated;
        });
      } finally {
        setCompressingIndex(null);
        setProgress(0);
      }
    },
    [imageCount]
  );

  const retakeImage = useCallback((index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      if (updated[index]?.preview) {
        revokeImagePreview(updated[index]!.preview);
      }
      updated[index] = null;
      return updated;
    });
  }, []);

  const allCaptured = images.every((img) => img !== null);

  const cleanup = useCallback(() => {
    images.forEach((img) => {
      if (img?.preview) revokeImagePreview(img.preview);
    });
    setImages(Array(imageCount).fill(null));
  }, [images, imageCount]);

  const reset = useCallback(
    (newCount: number) => {
      images.forEach((img) => {
        if (img?.preview) revokeImagePreview(img.preview);
      });
      setImages(Array(newCount).fill(null));
    },
    [images]
  );

  return {
    images,
    compressingIndex,
    progress,
    captureImage,
    retakeImage,
    allCaptured,
    cleanup,
    reset,
  };
}
