"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { PropertyImageData } from "@/components/admin/image-upload";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const BUCKET_NAME = "property-images";

export interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: "uploading" | "error";
  error?: string;
}

export interface UseImageUploadReturn {
  images: PropertyImageData[];
  uploading: UploadingFile[];
  handleFiles: (fileList: FileList | null) => void;
  handleDelete: (image: PropertyImageData) => Promise<void>;
  handleSetPrimary: (image: PropertyImageData) => Promise<void>;
  handleMove: (index: number, direction: "up" | "down") => Promise<void>;
  handleAltChange: (imageId: string, alt: string) => void;
  handleAltBlur: (imageId: string, alt: string) => Promise<void>;
  removeUploadingItem: (tempId: string) => void;
}

export function useImageUpload(
  propertyId: string,
  initialImages: PropertyImageData[] = [],
  onImagesChange?: (images: PropertyImageData[]) => void
): UseImageUploadReturn {
  const [images, setImages] = useState<PropertyImageData[]>(initialImages);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);

  // Ref always holds the latest images — prevents stale closure in concurrent uploads (#1)
  const imagesRef = useRef(images);
  useEffect(() => { imagesRef.current = images; }, [images]);

  // Cleanup object URLs on unmount to prevent memory leaks
  const uploadingRef = useRef(uploading);
  useEffect(() => { uploadingRef.current = uploading; }, [uploading]);
  useEffect(() => {
    return () => {
      uploadingRef.current.forEach((u) => URL.revokeObjectURL(u.preview));
    };
  }, []);

  const notifyChange = useCallback(
    (updated: PropertyImageData[]) => onImagesChange?.(updated),
    [onImagesChange]
  );

  // ── Validation ──────────────────────────────────────────────────────────

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `"${file.name}" is not a supported format. Use JPEG, PNG, or WebP.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" exceeds the 10MB limit.`;
    }
    return null;
  }

  // ── Upload ──────────────────────────────────────────────────────────────

  async function uploadFile(file: File, tempId: string) {
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `${propertyId}/${crypto.randomUUID()}.${ext}`;

    const setProgress = (progress: number) =>
      setUploading((prev) =>
        prev.map((u) => (u.id === tempId ? { ...u, progress } : u))
      );

    try {
      setProgress(20);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      setProgress(60);

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

      setProgress(80);

      // Use imagesRef.current (not images) to avoid stale closure when uploading concurrently
      const currentImages = imagesRef.current;
      const nextSortOrder = currentImages.length > 0
        ? Math.max(...currentImages.map((img) => img.sortOrder)) + 1
        : 0;

      const response = await fetch(`/api/properties/${propertyId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: publicUrl,
          storagePath,
          alt: "",
          sortOrder: nextSortOrder,
          isPrimary: currentImages.length === 0,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to save image record");
      }

      const savedImage: PropertyImageData = await response.json();
      setProgress(100);

      setImages((prev) => {
        const updated = [...prev, savedImage];
        notifyChange(updated);
        return updated;
      });

      setTimeout(
        () => setUploading((prev) => prev.filter((u) => u.id !== tempId)),
        500
      );
    } catch (error) {
      // Best-effort cleanup in Supabase Storage
      try {
        await createClient().storage.from(BUCKET_NAME).remove([storagePath]);
      } catch {
        // ignore
      }

      setUploading((prev) =>
        prev.map((u) =>
          u.id === tempId
            ? { ...u, status: "error", error: error instanceof Error ? error.message : "Upload failed" }
            : u
        )
      );

      toast.error(error instanceof Error ? error.message : `Failed to upload ${file.name}`);
    }
  }

  // ── Handle files ────────────────────────────────────────────────────────

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const newUploading: UploadingFile[] = [];
    for (const file of Array.from(fileList)) {
      const err = validateFile(file);
      if (err) { toast.error(err); continue; }

      const tempId = crypto.randomUUID();
      newUploading.push({
        id: tempId,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: "uploading",
      });
      uploadFile(file, tempId);
    }
    setUploading((prev) => [...prev, ...newUploading]);
  }

  // ── Delete ──────────────────────────────────────────────────────────────

  async function handleDelete(image: PropertyImageData) {
    try {
      const res = await fetch(`/api/properties/${propertyId}/images/${image.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed to delete image");

      setImages((prev) => {
        const updated = prev.filter((img) => img.id !== image.id);
        if (image.isPrimary && updated.length > 0) {
          updated[0] = { ...updated[0], isPrimary: true };
          fetch(`/api/properties/${propertyId}/images/${updated[0].id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPrimary: true }),
          }).then((res) => {
            if (!res.ok) toast.error("Primary image update failed — please refresh.");
          }).catch(() => toast.error("Primary image update failed — please refresh."));
        }
        notifyChange(updated);
        return updated;
      });

      toast.success("Image deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete image");
    }
  }

  // ── Set primary ─────────────────────────────────────────────────────────

  async function handleSetPrimary(image: PropertyImageData) {
    if (image.isPrimary) return;
    try {
      const res = await fetch(`/api/properties/${propertyId}/images/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      });
      if (!res.ok) throw new Error("Failed to set primary image");

      setImages((prev) => {
        const updated = prev.map((img) => ({ ...img, isPrimary: img.id === image.id }));
        notifyChange(updated);
        return updated;
      });
      toast.success("Primary image updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to set primary image");
    }
  }

  // ── Reorder ─────────────────────────────────────────────────────────────

  async function handleMove(index: number, direction: "up" | "down") {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= images.length) return;

    const previous = [...images];
    const updated = [...images];
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    const reordered = updated.map((img, i) => ({ ...img, sortOrder: i }));

    setImages(reordered);
    notifyChange(reordered);

    try {
      const res = await fetch(`/api/properties/${propertyId}/images/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: reordered.map((img) => img.id) }),
      });
      if (!res.ok) throw new Error("Server error");
    } catch (error) {
      console.error("Failed to persist image order:", error);
      // Rollback to previous state
      setImages(previous);
      notifyChange(previous);
      toast.error("Failed to reorder images — please try again.");
    }
  }

  // ── Alt text ────────────────────────────────────────────────────────────

  function handleAltChange(imageId: string, alt: string) {
    setImages((prev) => {
      const updated = prev.map((img) => (img.id === imageId ? { ...img, alt } : img));
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

  // ── Remove failed upload ────────────────────────────────────────────────

  function removeUploadingItem(tempId: string) {
    setUploading((prev) => {
      const item = prev.find((u) => u.id === tempId);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((u) => u.id !== tempId);
    });
  }

  return {
    images,
    uploading,
    handleFiles,
    handleDelete,
    handleSetPrimary,
    handleMove,
    handleAltChange,
    handleAltBlur,
    removeUploadingItem,
  };
}
