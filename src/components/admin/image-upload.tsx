"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
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

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

// ── Types ────────────────────────────────────────────────────────────

export interface PropertyImageData {
  id: string;
  url: string;
  storagePath: string;
  alt: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: "uploading" | "error";
  error?: string;
}

interface ImageUploadProps {
  propertyId: string;
  initialImages?: PropertyImageData[];
  onImagesChange?: (images: PropertyImageData[]) => void;
}

// ── Constants ────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const BUCKET_NAME = "property-images";

// ── Component ────────────────────────────────────────────────────────

export function ImageUpload({
  propertyId,
  initialImages = [],
  onImagesChange,
}: ImageUploadProps) {
  const [images, setImages] = useState<PropertyImageData[]>(initialImages);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notify parent of changes
  const notifyChange = useCallback(
    (updated: PropertyImageData[]) => {
      onImagesChange?.(updated);
    },
    [onImagesChange]
  );

  // ── File validation ──────────────────────────────────────────────

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `"${file.name}" is not a supported format. Use JPEG, PNG, or WebP.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" exceeds the 10MB limit.`;
    }
    return null;
  }

  // ── Upload a single file ────────────────────────────────────────

  async function uploadFile(file: File, tempId: string) {
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const uuid = crypto.randomUUID();
    const storagePath = `${propertyId}/${uuid}.${ext}`;

    try {
      // Update progress
      setUploading((prev) =>
        prev.map((u) => (u.id === tempId ? { ...u, progress: 20 } : u))
      );

      // Upload directly to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setUploading((prev) =>
        prev.map((u) => (u.id === tempId ? { ...u, progress: 60 } : u))
      );

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

      setUploading((prev) =>
        prev.map((u) => (u.id === tempId ? { ...u, progress: 80 } : u))
      );

      // Save image record to database via API
      const nextSortOrder =
        images.length > 0
          ? Math.max(...images.map((img) => img.sortOrder)) + 1
          : 0;
      const isFirstImage = images.length === 0;

      const response = await fetch(`/api/properties/${propertyId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: publicUrl,
          storagePath,
          alt: "",
          sortOrder: nextSortOrder,
          isPrimary: isFirstImage,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to save image record");
      }

      const savedImage: PropertyImageData = await response.json();

      setUploading((prev) =>
        prev.map((u) => (u.id === tempId ? { ...u, progress: 100 } : u))
      );

      // Add to images list and remove from uploading
      setImages((prev) => {
        const updated = [...prev, savedImage];
        notifyChange(updated);
        return updated;
      });

      // Remove from uploading after a brief delay so user sees 100%
      setTimeout(() => {
        setUploading((prev) => prev.filter((u) => u.id !== tempId));
      }, 500);
    } catch (error) {
      console.error("Upload failed:", error);

      // Try to clean up the storage file on failure
      try {
        await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      } catch {
        // Ignore cleanup errors
      }

      setUploading((prev) =>
        prev.map((u) =>
          u.id === tempId
            ? {
                ...u,
                status: "error",
                error:
                  error instanceof Error ? error.message : "Upload failed",
              }
            : u
        )
      );

      toast.error(
        error instanceof Error ? error.message : `Failed to upload ${file.name}`
      );
    }
  }

  // ── Handle files selected / dropped ─────────────────────────────

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const newUploading: UploadingFile[] = [];

    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        continue;
      }

      const tempId = crypto.randomUUID();
      newUploading.push({
        id: tempId,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: "uploading",
      });

      // Start upload
      uploadFile(file, tempId);
    }

    setUploading((prev) => [...prev, ...newUploading]);
  }

  // ── Drag & drop handlers ────────────────────────────────────────

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  // ── Delete image ────────────────────────────────────────────────

  async function handleDelete(image: PropertyImageData) {
    try {
      const response = await fetch(
        `/api/properties/${propertyId}/images/${image.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to delete image");
      }

      setImages((prev) => {
        const updated = prev.filter((img) => img.id !== image.id);
        // If deleted image was primary and there are remaining images, make the first one primary
        if (image.isPrimary && updated.length > 0) {
          updated[0] = { ...updated[0], isPrimary: true };
          // Also update on server
          fetch(`/api/properties/${propertyId}/images/${updated[0].id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPrimary: true }),
          }).catch(console.error);
        }
        notifyChange(updated);
        return updated;
      });

      toast.success("Image deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete image"
      );
    }
  }

  // ── Set primary image ───────────────────────────────────────────

  async function handleSetPrimary(image: PropertyImageData) {
    if (image.isPrimary) return;

    try {
      const response = await fetch(
        `/api/properties/${propertyId}/images/${image.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPrimary: true }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to set primary image");
      }

      setImages((prev) => {
        const updated = prev.map((img) => ({
          ...img,
          isPrimary: img.id === image.id,
        }));
        notifyChange(updated);
        return updated;
      });

      toast.success("Primary image updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to set primary image"
      );
    }
  }

  // ── Reorder images ──────────────────────────────────────────────

  async function handleMove(index: number, direction: "up" | "down") {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= images.length) return;

    const updated = [...images];
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    // Reassign sortOrder values
    const reordered = updated.map((img, i) => ({ ...img, sortOrder: i }));

    setImages(reordered);
    notifyChange(reordered);

    // Persist new order to server
    try {
      await fetch(`/api/properties/${propertyId}/images/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageIds: reordered.map((img) => img.id),
        }),
      });
    } catch (error) {
      console.error("Failed to persist image order:", error);
    }
  }

  // ── Update alt text ─────────────────────────────────────────────

  async function handleAltChange(imageId: string, alt: string) {
    setImages((prev) => {
      const updated = prev.map((img) =>
        img.id === imageId ? { ...img, alt } : img
      );
      notifyChange(updated);
      return updated;
    });
  }

  async function handleAltBlur(imageId: string, alt: string) {
    try {
      await fetch(`/api/properties/${propertyId}/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt }),
      });
    } catch (error) {
      console.error("Failed to save alt text:", error);
    }
  }

  // ── Remove failed upload from list ──────────────────────────────

  function removeUploadingItem(tempId: string) {
    setUploading((prev) => {
      const item = prev.find((u) => u.id === tempId);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((u) => u.id !== tempId);
    });
  }

  // ── Render ──────────────────────────────────────────────────────

  const hasImages = images.length > 0 || uploading.length > 0;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <ImagePlus className="size-6 text-muted-foreground" />
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Upload className="size-4" />
          <span>Drag and drop images here, or click to browse</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          JPEG, PNG, WebP -- max 10MB each
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
            {uploading.length > 0 &&
              ` -- ${uploading.length} uploading`}
          </p>

          <div className="grid gap-4">
            {/* Existing images */}
            {images.map((image, index) => (
              <Card key={image.id} className="overflow-hidden">
                <CardContent className="flex items-start gap-4 p-4">
                  {/* Drag handle / order buttons */}
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

                  {/* Details */}
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Input
                      placeholder="Alt text (for accessibility)"
                      value={image.alt || ""}
                      onChange={(e) =>
                        handleAltChange(image.id, e.target.value)
                      }
                      onBlur={(e) =>
                        handleAltBlur(image.id, e.target.value)
                      }
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
                      title={
                        image.isPrimary
                          ? "Primary image"
                          : "Set as primary image"
                      }
                      onClick={() => handleSetPrimary(image)}
                      disabled={image.isPrimary}
                    >
                      <Star
                        className={`size-4 ${image.isPrimary ? "fill-current" : ""}`}
                      />
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
                  {/* Thumbnail preview */}
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

                  {/* Progress / error info */}
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <p className="truncate text-sm font-medium">
                      {item.file.name}
                    </p>
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

                  {/* Remove button (for errors) */}
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
