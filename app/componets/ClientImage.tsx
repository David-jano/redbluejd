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

// Use a reliable CDN for placeholder images
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=600&fit=crop";

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

  // For Cloudinary URLs, skip Next.js optimization
  const isCloudinaryUrl = imgSrc?.includes('res.cloudinary.com');
  const shouldUnoptimize = isCloudinaryUrl || imgSrc === DEFAULT_IMAGE || hasError;

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
        unoptimized={shouldUnoptimize}
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
      unoptimized={shouldUnoptimize}
    />
  );
}