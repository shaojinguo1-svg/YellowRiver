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
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-col gap-3 rounded-xl bg-white/95 p-4 shadow-xl backdrop-blur-sm sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:p-2">
        {/* Location input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="City, neighborhood, or ZIP"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
          />
        </div>

        {/* Divider */}
        <div className="hidden h-8 w-px bg-border sm:block" />

        {/* Bedrooms select */}
        <Select value={bedrooms} onValueChange={setBedrooms}>
          <SelectTrigger className="w-full border-0 bg-transparent shadow-none focus-visible:ring-0 sm:w-36">
            <SelectValue placeholder="Bedrooms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Bedroom</SelectItem>
            <SelectItem value="2">2 Bedrooms</SelectItem>
            <SelectItem value="3">3 Bedrooms</SelectItem>
            <SelectItem value="4">4+ Bedrooms</SelectItem>
          </SelectContent>
        </Select>

        {/* Search button */}
        <Button
          onClick={handleSearch}
          className="bg-amber-500 text-white hover:bg-amber-600 sm:rounded-full sm:px-6"
          size="lg"
        >
          <Search className="mr-2 size-4" />
          Search
        </Button>
      </div>
    </div>
  );
}
