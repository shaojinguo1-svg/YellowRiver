"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyGalleryProps {
  images: { url: string; alt: string }[];
}

export function PropertyGallery({ images }: PropertyGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-ivory-warm text-warm-300">
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

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const goNext = () =>
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % images.length : 0
    );
  const goPrev = () =>
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + images.length) % images.length : 0
    );

  // Bento grid layout
  return (
    <>
      <div className="grid gap-2 rounded-2xl overflow-hidden">
        {images.length === 1 ? (
          /* Single image */
          <button
            onClick={() => openLightbox(0)}
            className="relative aspect-[16/9] w-full overflow-hidden cursor-pointer group"
          >
            <Image
              src={images[0].url}
              alt={images[0].alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="1200px"
              priority
            />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
          </button>
        ) : images.length === 2 ? (
          /* Two images side by side */
          <div className="grid grid-cols-2 gap-2">
            {images.slice(0, 2).map((img, i) => (
              <button
                key={i}
                onClick={() => openLightbox(i)}
                className="relative aspect-[4/3] overflow-hidden cursor-pointer group"
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="600px"
                  priority={i === 0}
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
              </button>
            ))}
          </div>
        ) : (
          /* 3+ images — bento grid: big left, stacked right */
          <>
            {/* Desktop: bento grid */}
            <div className="hidden gap-2 md:grid md:grid-cols-2 md:grid-rows-2">
              {/* Main large image */}
              <button
                onClick={() => openLightbox(0)}
                className="relative aspect-[4/3] overflow-hidden cursor-pointer group md:row-span-2"
              >
                <Image
                  src={images[0].url}
                  alt={images[0].alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="600px"
                  priority
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
              </button>

              {/* Top right */}
              <button
                onClick={() => openLightbox(1)}
                className="relative aspect-[4/3] overflow-hidden cursor-pointer group"
              >
                <Image
                  src={images[1].url}
                  alt={images[1].alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="600px"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
              </button>

              {/* Bottom right — with "show all" overlay if more images */}
              <button
                onClick={() => openLightbox(2)}
                className="relative aspect-[4/3] overflow-hidden cursor-pointer group"
              >
                <Image
                  src={images[2].url}
                  alt={images[2].alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="600px"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                {images.length > 3 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-charcoal/50 transition-colors group-hover:bg-charcoal/60">
                    <div className="flex items-center gap-2 text-white">
                      <Images className="size-5" />
                      <span className="text-sm font-medium">
                        +{images.length - 3} more
                      </span>
                    </div>
                  </div>
                )}
              </button>
            </div>

            {/* Mobile: main image + horizontal scroll thumbnails */}
            <div className="md:hidden">
              <button
                onClick={() => openLightbox(0)}
                className="relative aspect-[16/9] w-full overflow-hidden cursor-pointer group"
              >
                <Image
                  src={images[0].url}
                  alt={images[0].alt}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
                {images.length > 1 && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-charcoal/70 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                    <Images className="size-3.5" />
                    {images.length} photos
                  </div>
                )}
              </button>
              {images.length > 1 && (
                <div className="mt-2 flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => openLightbox(i)}
                      className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg"
                    >
                      <Image
                        src={img.url}
                        alt={img.alt}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <X className="size-5" />
          </button>

          {/* Previous */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative h-[60vh] w-[95vw] max-w-5xl sm:h-[80vh] sm:w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex].url}
              alt={images[lightboxIndex].alt}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <ChevronRight className="size-5" />
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
