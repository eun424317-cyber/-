import { useState } from 'react';
import { Palette } from 'lucide-react';

interface ResilientImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#EFE6F7] via-[#F7EFFB] to-[#FAEEEB] text-[#5B3765] p-6 text-center ${className}`}
      >
        <Palette className="w-8 h-8 mb-2 opacity-70" />
        <p className="font-serif text-sm font-medium text-[#2B1F33]">
          {fallbackTitle || alt}
        </p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
