"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type AnimationDirection = "up" | "left" | "right" | "fade";

interface AnimateOnScrollProps {
  children: React.ReactNode;
  direction?: AnimationDirection;
  delay?: number;
  className?: string;
  threshold?: number;
}

const animationMap: Record<AnimationDirection, string> = {
  up: "animate-fade-in-up",
  left: "animate-fade-in-left",
  right: "animate-fade-in-right",
  fade: "animate-fade-in",
};

export function AnimateOnScroll({
  children,
  direction = "up",
  delay = 0,
  className,
  threshold = 0.1,
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={cn(
        isVisible ? animationMap[direction] : "opacity-0",
        className
      )}
      style={isVisible && delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
