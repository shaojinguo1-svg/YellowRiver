"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function HeroSearch() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [bedrooms, setBedrooms] = useState("");

  function handleSearch() {
    const params = new URLSearchParams();
    if (location.trim()) {
      params.set("location", location.trim());
    }
    if (bedrooms) {
      params.set("bedrooms", bedrooms);
    }
    const query = params.toString();
    router.push(`/listings${query ? `?${query}` : ""}`);
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-col gap-3 rounded-xl bg-white/95 p-4 shadow-2xl backdrop-blur-sm sm:flex-row sm:items-center sm:gap-0 sm:p-6">
        {/* Location input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gold-light" />
          <Input
            type="text"
            placeholder="City, neighborhood, or ZIP"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="border-0 bg-transparent pl-10 text-base text-warm-900 shadow-none placeholder:text-warm-500 focus-visible:ring-0"
          />
        </div>

        {/* Divider */}
        <div className="hidden h-8 w-px bg-warm-200 sm:block" />

        {/* Bedrooms select */}
        <Select value={bedrooms} onValueChange={setBedrooms}>
          <SelectTrigger className="w-full border-0 bg-transparent text-warm-900 shadow-none focus-visible:ring-0 sm:w-40">
            <SelectValue placeholder="Bedrooms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Bedroom</SelectItem>
            <SelectItem value="2">2 Bedrooms</SelectItem>
            <SelectItem value="3">3 Bedrooms</SelectItem>
            <SelectItem value="4">4+ Bedrooms</SelectItem>
          </SelectContent>
        </Select>

        {/* Divider */}
        <div className="hidden h-8 w-px bg-warm-200 sm:block" />

        {/* Search button */}
        <Button
          onClick={handleSearch}
          className="bg-gold text-white hover:bg-gold-dark rounded-lg sm:ml-4 sm:px-8"
          size="lg"
        >
          <Search className="mr-2 size-4" />
          Search
        </Button>
      </div>
    </div>
  );
}
