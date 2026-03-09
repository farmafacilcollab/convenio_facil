"use client";

import JSZip from "jszip";
import type { ExportImageData } from "./index";

export async function generateZip(data: ExportImageData): Promise<Blob> {
  const zip = new JSZip();

  const folder = zip.folder(data.convenioName) ?? zip;
  let failedCount = 0;

  for (const img of data.images) {
    const safeName = img.conveniadoName.replace(/[^a-zA-Z0-9À-ú\s-]/g, "");
    const subFolder = `${img.saleDate}_${safeName}`;
    const fileName = img.installmentNumber
      ? `parcela_${img.installmentNumber}.webp`
      : "pagamento_unico.webp";

    try {
      const response = await fetch(img.signedUrl);
      if (!response.ok) {
        failedCount++;
        continue;
      }
      const blob = await response.blob();
      folder.file(`${subFolder}/${fileName}`, blob);
    } catch {
      failedCount++;
      continue;
    }
  }

  if (failedCount > 0 && failedCount === data.images.length) {
    throw new Error("Falha ao baixar todas as imagens");
  }

  return zip.generateAsync({ type: "blob" });
}
