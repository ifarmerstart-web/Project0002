import React from 'react';

interface CropIconProps {
  src: string;
  alt: string;
  className?: string;
}

export const CropIcon: React.FC<CropIconProps> = ({ src, alt, className }) => {
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      loading="eager"
      decoding="async"
    />
  );
};