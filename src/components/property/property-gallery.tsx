"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PropertyGalleryProps {
  images: { url: string; alt: string }[];
}

export function PropertyGallery({ images }: PropertyGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-ivory-warm text-warm-300">
        <svg
          className="size-24"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
          />
        </svg>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl shadow-md bg-ivory">
        <Image
          src={selectedImage.url}
          alt={selectedImage.alt}
          fill
          className="object-cover transition-opacity duration-500"
          sizes="(max-width: 1024px) 100vw, 1200px"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative aspect-[16/9] w-24 shrink-0 overflow-hidden rounded-md border-2 transition-all duration-300 sm:w-28 md:w-32",
                index === selectedIndex
                  ? "border-gold ring-1 ring-gold/50"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="128px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
