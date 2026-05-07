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
  // Prevent scrolling when modal is open
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
      onClick={onClose} // Close on backdrop click
    >
      <div 
        className="relative max-w-7xl max-h-[90vh] w-auto h-auto bg-transparent rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on image
      >
        {/* Close Button - X icon */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all"
          aria-label="Close image view"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* The Big Image */}
        <div className="relative aspect-auto">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={1200}
            height={800}
            className="object-contain max-h-[90vh] rounded-2xl"
            priority
          />
        </div>
      </div>
    </div>
  );
};