
import React, { useState, useEffect } from 'react';

interface CropIconProps {
  src: string;
  alt: string;
  className?: string;
}

export const CropIcon: React.FC<CropIconProps> = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Reset state if src changes
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      // 콘솔에 에러가 난 경로를 출력합니다. (F12에서 확인 가능)
      console.error("이미지 로드 실패 경로:", src); 
      setHasError(true);
      const text = alt.substring(0, 3).toUpperCase();
      setImgSrc(`https://placehold.co/128x128/transparent/transparent?text=${text}&font=roboto`);
    }
  };

  return (
    <img 
      src={imgSrc} 
      alt={alt} 
      className={className} 
      onError={handleError}
      loading="lazy"
    />
  );
};
