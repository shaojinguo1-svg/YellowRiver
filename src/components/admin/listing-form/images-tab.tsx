"use client";

import { ImageUpload } from "@/components/admin/image-upload";
import type { PropertyImageData } from "@/components/admin/image-upload";
import { Card, CardContent } from "@/components/ui/card";

interface ImagesTabProps {
  mode: "create" | "edit";
  propertyId?: string;
  initialImages?: PropertyImageData[];
}

export function ImagesTab({ mode, propertyId, initialImages = [] }: ImagesTabProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        {mode === "edit" && propertyId ? (
          <ImageUpload
            propertyId={propertyId}
            initialImages={initialImages}
          />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Save the listing first, then you can upload images.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
