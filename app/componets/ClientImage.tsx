"use client";

import Image from "next/image";
import { useState } from "react";

interface ClientImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  width?: number;
  height?: number;
}

const DEFAULT_IMAGE = "https://placehold.co/800x600/e0e0e0/999?text=No+Image";

export default function ClientImage({ 
  src, 
  alt, 
  fill = false, 
  priority = false, 
  className = "", 
  sizes,
  width,
  height 
}: ClientImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      console.warn(`Failed to load image: ${src}`);
      setHasError(true);
      setImgSrc(DEFAULT_IMAGE);
    }
  };

  if (fill) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        fill
        priority={priority}
        className={className}
        sizes={sizes}
        onError={handleError}
        unoptimized={imgSrc === DEFAULT_IMAGE}
      />
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width || 800}
      height={height || 600}
      priority={priority}
      className={className}
      onError={handleError}
      unoptimized={imgSrc === DEFAULT_IMAGE}
    />
  );
}