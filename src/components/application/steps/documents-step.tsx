"use client";

import { useState, useRef, useCallback } from "react";
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { ApplicationInput } from "@/validations/application";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const BUCKET = "application-documents";

interface UploadedFile {
  name: string;
  url: string;
  storagePath: string;
}

interface DocumentsStepProps {
  register: UseFormRegister<ApplicationInput>;
  errors: FieldErrors<ApplicationInput>;
  watch: UseFormWatch<ApplicationInput>;
  setValue: UseFormSetValue<ApplicationInput>;
}

function FileUploadZone({
  label,
  required,
  onUpload,
}: {
  label: string;
  required?: boolean;
  onUpload?: (file: UploadedFile) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not supported. Use PDF, JPG, or PNG.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds the 10MB limit.`);
        return;
      }

      setUploading(true);
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
        const storagePath = `${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, file, { contentType: file.type, upsert: false });

        if (error) throw new Error(error.message);

        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(storagePath);

        const uploadedFile: UploadedFile = {
          name: file.name,
          url: publicUrl,
          storagePath,
        };

        setUploaded(uploadedFile);
        onUpload?.(uploadedFile);
        toast.success(`${file.name} uploaded`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const handleRemove = useCallback(async () => {
    if (!uploaded) return;
    try {
      const supabase = createClient();
      await supabase.storage.from(BUCKET).remove([uploaded.storagePath]);
    } catch {
      // best-effort cleanup
    }
    setUploaded(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [uploaded]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (uploaded) {
    return (
      <div className="space-y-2">
        <Label>
          {label}{" "}
          {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950/30">
          <CheckCircle2 className="size-5 shrink-0 text-green-600" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {uploaded.name}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>
        {label}{" "}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <label
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-8 text-center transition-colors hover:border-muted-foreground/40 hover:bg-muted/50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {uploading ? (
          <Loader2 className="size-8 animate-spin text-gold" />
        ) : (
          <Upload className="size-8 text-muted-foreground/50" />
        )}
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {uploading ? "Uploading..." : "Drag & drop or click to upload"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            PDF, JPG, PNG up to 10MB
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>
    </div>
  );
}

export function DocumentsStep({
  register,
  errors,
  watch,
  setValue,
}: DocumentsStepProps) {
  const hasPets = watch("hasPets");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Documents & Additional Information
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide additional details about your household and upload required
          documents.
        </p>
      </div>

      {/* Number of Occupants */}
      <div className="space-y-2">
        <Label htmlFor="numberOfOccupants">
          Number of Occupants <span className="text-destructive">*</span>
        </Label>
        <Input
          id="numberOfOccupants"
          type="number"
          min="1"
          step="1"
          placeholder="1"
          {...register("numberOfOccupants")}
          aria-invalid={!!errors.numberOfOccupants}
        />
        {errors.numberOfOccupants && (
          <p className="text-sm text-destructive">
            {errors.numberOfOccupants.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Total number of people who will live in the unit, including yourself.
        </p>
      </div>

      {/* Has Pets */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="hasPets"
            checked={hasPets || false}
            onCheckedChange={(checked) =>
              setValue("hasPets", checked === true, { shouldValidate: true })
            }
          />
          <div className="space-y-1">
            <Label htmlFor="hasPets" className="cursor-pointer">
              I have pets
            </Label>
            <p className="text-xs text-muted-foreground">
              Check this box if you have any pets that will live with you.
            </p>
          </div>
        </div>

        {hasPets && (
          <div className="ml-7 space-y-2">
            <Label htmlFor="petDescription">
              Pet Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="petDescription"
              placeholder="e.g., 1 golden retriever (45 lbs), 1 domestic shorthair cat"
              rows={3}
              {...register("petDescription")}
              aria-invalid={!!errors.petDescription}
            />
            {errors.petDescription && (
              <p className="text-sm text-destructive">
                {errors.petDescription.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="additionalNotes">Additional Notes</Label>
        <Textarea
          id="additionalNotes"
          placeholder="Any additional information you'd like to share..."
          rows={4}
          {...register("additionalNotes")}
          aria-invalid={!!errors.additionalNotes}
        />
        {errors.additionalNotes && (
          <p className="text-sm text-destructive">
            {errors.additionalNotes.message}
          </p>
        )}
      </div>

      {/* File Upload Areas */}
      <div className="space-y-6">
        <div className="border-b pb-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Required Documents
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FileUploadZone label="Government ID" required />
          <FileUploadZone label="Proof of Income" required />
        </div>

        <FileUploadZone label="Additional Documents" />
      </div>
    </div>
  );
}
