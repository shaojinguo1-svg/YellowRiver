"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PropertyCreateInput } from "@/validations/property";

export function SeoTab() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<PropertyCreateInput>();

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        {/* Meta Title */}
        <div className="space-y-2">
          <Label htmlFor="metaTitle">Meta Title</Label>
          <Input
            id="metaTitle"
            placeholder="SEO-friendly title (max 60 characters)"
            maxLength={60}
            {...register("metaTitle")}
          />
          <p className="text-xs text-muted-foreground">
            {(watch("metaTitle") ?? "").length}/60 characters
          </p>
          {errors.metaTitle && (
            <p className="text-sm text-destructive">{errors.metaTitle.message}</p>
          )}
        </div>

        {/* Meta Description */}
        <div className="space-y-2">
          <Label htmlFor="metaDescription">Meta Description</Label>
          <Textarea
            id="metaDescription"
            placeholder="Brief SEO description (max 160 characters)"
            maxLength={160}
            rows={3}
            {...register("metaDescription")}
          />
          <p className="text-xs text-muted-foreground">
            {(watch("metaDescription") ?? "").length}/160 characters
          </p>
          {errors.metaDescription && (
            <p className="text-sm text-destructive">{errors.metaDescription.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
