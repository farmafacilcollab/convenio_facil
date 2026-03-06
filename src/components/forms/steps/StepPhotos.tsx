"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ptBR } from "@/lib/i18n/pt-BR";

interface ImageCaptureHook {
  images: (import("@/lib/types/app.types").CompressedImage | null)[];
  compressingIndex: number | null;
  progress: number;
  captureImage: (file: File, index: number) => Promise<void>;
  retakeImage: (index: number) => void;
  allCaptured: boolean;
  cleanup: () => void;
  reset: (newCount: number) => void;
}

interface Props {
  imageCount: number;
  isInstallment: boolean;
  imageCapture: ImageCaptureHook;
}

export function StepPhotos({ imageCount, isInstallment, imageCapture }: Props) {
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await imageCapture.captureImage(file, index);
    } catch (err) {
      console.error(err);
    }
    // Clear input so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: imageCount }).map((_, index) => {
        const image = imageCapture.images[index];
        const isCompressing = imageCapture.compressingIndex === index;

        const label = isInstallment
          ? `${ptBR.captureInstallment} ${index + 1}/${imageCount}`
          : ptBR.capturePhoto;

        return (
          <div key={index} className="space-y-2">
            <input
              ref={(el) => { fileInputRefs.current[index] = el; }}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileChange(e, index)}
            />

            {!image && !isCompressing && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-32 w-full flex-col gap-2 border-dashed text-muted-foreground"
                onClick={() => fileInputRefs.current[index]?.click()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                <span className="text-sm font-medium">{label}</span>
              </Button>
            )}

            {isCompressing && (
              <div className="flex h-32 flex-col items-center justify-center gap-3 rounded-xl border border-dashed">
                <span className="text-sm text-muted-foreground">
                  {ptBR.compressing}
                </span>
                <Progress value={imageCapture.progress} className="w-48" />
              </div>
            )}

            {image && !isCompressing && (
              <div className="relative overflow-hidden rounded-xl border">
                <img
                  src={image.preview}
                  alt={label}
                  className="h-40 w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/50 px-3 py-2 text-white">
                  <span className="text-xs">
                    {Math.round(image.compressedSize / 1024)}KB
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-white hover:text-white"
                    onClick={() => {
                      imageCapture.retakeImage(index);
                    }}
                  >
                    {ptBR.retakePhoto}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
