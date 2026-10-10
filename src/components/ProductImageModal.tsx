// components/ProductImageModal.tsx
'use client';

import Image from 'next/image';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';

interface ProductImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
}

export const ProductImageModal = ({ isOpen, onClose, imageSrc, imageAlt }: ProductImageModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="relative max-w-7xl max-h-[90vh] w-auto h-auto bg-transparent rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button – always visible with high contrast */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full text-white transition-all border border-white/20 shadow-lg"
          aria-label="Close image view"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Image Container – fixed max size, image scales to fit */}
        <div className="relative w-auto h-auto max-w-[90vw] max-h-[85vh] flex items-center justify-center">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={1200}
            height={900}
            className="object-contain rounded-2xl max-h-[85vh] w-auto h-auto"
            priority
            quality={90}
          />
        </div>
      </div>
    </div>
  );
};