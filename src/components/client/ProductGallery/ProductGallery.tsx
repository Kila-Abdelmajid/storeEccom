'use client';

import { useState } from 'react';
import Image from 'next/image';
import ImageModal from '@/components/ui/ImageModal';

interface ProductGalleryProps {
  mainImage: string;
  name: string;
  additionalImages: string[];
  isNew: boolean;
}

export default function ProductGallery({ mainImage, name, additionalImages, isNew }: ProductGalleryProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ src: mainImage, alt: name });

  const openModal = (src: string, alt: string) => {
    setSelectedImage({ src, alt });
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="relative group">
        <div
          className="aspect-square bg-[#F9F9F9] rounded-3xl overflow-hidden flex items-center justify-center p-12 cursor-pointer"
          onClick={() => openModal(mainImage, name)}
        >
          <div className="relative w-full h-full transform group-hover:scale-105 transition-transform duration-700">
            <Image src={mainImage} alt={name} fill className="object-contain mix-blend-multiply" priority />
          </div>
        </div>
        {isNew && (
          <div className="absolute top-6 left-6">
            <span className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">New Arrival</span>
          </div>
        )}
      </div>

      {additionalImages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 animate-fadeInUp">
          {additionalImages.map((img, idx) => (
            <div
              key={idx}
              className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#F9F9F9] cursor-pointer border-2 border-transparent thumbnail-hover flex-shrink-0"
              onClick={() => openModal(img, `${name} view ${idx + 1}`)}
            >
              <Image src={img} alt={`${name} view ${idx + 1}`} fill className="object-cover transition-transform duration-300" />
            </div>
          ))}
        </div>
      )}

      {modalOpen && <ImageModal src={selectedImage.src} alt={selectedImage.alt} onClose={() => setModalOpen(false)} />}
    </div>
  );
}