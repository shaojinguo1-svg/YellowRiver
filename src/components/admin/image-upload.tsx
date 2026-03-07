"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  GripVertical,
  Star,
  ChevronUp,
  ChevronDown,
  Loader2,
  ImagePlus,
} from "lucide-react";

import { useImageUpload } from "@/hooks/use-image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

// ── Types ─────────────────────────────────────────────────────────────────

export interface PropertyImageData {
  id: string;
  url: string;
  storagePath: string;
  alt: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

interface ImageUploadProps {
  propertyId: string;
  initialImages?: PropertyImageData[];
  onImagesChange?: (images: PropertyImageData[]) => void;
}

// ── Component (rendering only — all logic lives in useImageUpload) ─────────

export function ImageUpload({
  propertyId,
  initialImages = [],
  onImagesChange,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    images,
    uploading,
    handleFiles,
    handleDelete,
    handleSetPrimary,
    handleMove,
    handleAltChange,
    handleAltBlur,
    removeUploadingItem,
  } = useImageUpload(propertyId, initialImages, onImagesChange);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  }

  const hasImages = images.length > 0 || uploading.length > 0;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-12 text-center transition-colors hover:border-primary/50"
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <ImagePlus className="size-6 text-muted-foreground" />
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Upload className="size-4" />
          <span>Drag and drop images here, or click to browse</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          JPEG, PNG, WebP — max 10MB each
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Image grid */}
      {hasImages && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {images.length} image{images.length !== 1 ? "s" : ""} uploaded
            {uploading.length > 0 && ` — ${uploading.length} uploading`}
          </p>

          <div className="grid gap-4">
            {/* Uploaded images */}
            {images.map((image, index) => (
              <Card key={image.id} className="overflow-hidden">
                <CardContent className="flex items-start gap-4 p-4">
                  {/* Order buttons */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <GripVertical className="size-4 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={index === images.length - 1}
                      onClick={() => handleMove(index, "down")}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={image.url}
                      alt={image.alt || "Property image"}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                    {image.isPrimary && (
                      <div className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                        Primary
                      </div>
                    )}
                  </div>

                  {/* Alt text + path */}
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Input
                      placeholder="Alt text (for accessibility)"
                      value={image.alt || ""}
                      onChange={(e) => handleAltChange(image.id, e.target.value)}
                      onBlur={(e) => handleAltBlur(image.id, e.target.value)}
                      className="text-sm"
                    />
                    <p className="truncate text-xs text-muted-foreground">
                      {image.storagePath}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant={image.isPrimary ? "default" : "outline"}
                      size="icon"
                      className="size-8"
                      title={image.isPrimary ? "Primary image" : "Set as primary image"}
                      onClick={() => handleSetPrimary(image)}
                      disabled={image.isPrimary}
                    >
                      <Star className={`size-4 ${image.isPrimary ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      title="Delete image"
                      onClick={() => handleDelete(image)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Uploading items */}
            {uploading.map((item) => (
              <Card key={item.id} className="overflow-hidden opacity-80">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={item.preview}
                      alt="Uploading"
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized
                    />
                    {item.status === "uploading" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 className="size-6 animate-spin text-white" />
                      </div>
                    )}
                    {item.status === "error" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-500/40">
                        <X className="size-6 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <p className="truncate text-sm font-medium">{item.file.name}</p>
                    {item.status === "uploading" && (
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                    {item.status === "error" && (
                      <p className="text-xs text-destructive">
                        {item.error || "Upload failed"}
                      </p>
                    )}
                  </div>

                  {item.status === "error" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => removeUploadingItem(item.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
