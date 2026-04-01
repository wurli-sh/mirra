import { useState } from "react";

interface AnimatedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClass?: string;
}

export function AnimatedImage({
  src,
  alt,
  className = "",
  placeholderClass = "",
}: AnimatedImageProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="relative">
      {/* Skeleton */}
      <div
        className={`absolute inset-0 z-20 rounded-lg overflow-hidden transition-opacity duration-300 ${placeholderClass} ${imgLoaded ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <div className="h-full w-full animate-pulse bg-primary" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]" />
      </div>
      {/* Image — fades in from scale(0.95), never scale(0) */}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-all duration-200 ease-out ${imgLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        onLoad={() => setImgLoaded(true)}
      />
    </div>
  );
}
