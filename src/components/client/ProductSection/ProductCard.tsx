// components/ProductCard.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Product } from '@/types/product';
import {
  ShoppingCartIcon,
  EyeIcon,
  HeartIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';
import { formatPrice } from '@/utils/format';
import { RatingStars } from '@/components/ui/RatingStars';
import { ProductImageModal } from '@/components/ProductImageModal';
import { AppButton } from '../../ui/AppButton';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
  categoryName?: string;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard = ({
  product,
  categoryName = 'Premium',
  onAddToCart,
}: ProductCardProps) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Safe numeric values
  const price = Number(product.price) || 0;
  const oldPrice = product.oldPrice ? Number(product.oldPrice) : null;
  const discountPercent = oldPrice && oldPrice > price
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

  const isInStock = (product.stock ?? 0) > 0;
  const rating = typeof product.rating === 'number' ? product.rating : 0;
  const reviews = typeof product.reviews === 'number' ? product.reviews : 0;

  return (
    <>
      <div className="group relative w-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100">
        {/* Image Section */}
        <div className="relative h-72 w-full bg-[#F9F9F9] flex items-center justify-center p-6">
          {oldPrice && discountPercent > 0 && (
            <div className="absolute top-4 left-4 z-10 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-tight">
              -{discountPercent}%
            </div>
          )}

          <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm text-gray-900 font-bold px-3 py-1.5 rounded-full shadow-sm text-xs border border-gray-100">
            {formatPrice(price)}
          </div>

          <div className="absolute top-14 right-4 z-10 flex flex-col gap-2">
            <button className="p-2.5 bg-white shadow-md rounded-full text-gray-400 hover:text-rose-500 transition-all border border-gray-50">
              <HeartIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsImageModalOpen(true)}
              className="p-2.5 bg-white shadow-md rounded-full text-gray-400 hover:text-[#c9a96e] transition-all border border-gray-50"
            >
              <ArrowsPointingOutIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="relative w-full h-full transform group-hover:scale-105 transition-transform duration-700">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain mix-blend-multiply"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <p className="text-[#c9a96e] text-[10px] font-bold uppercase tracking-widest">
              {categoryName}
            </p>
            <h3 className="text-gray-900 text-base font-bold truncate mt-1">
              {product.name}
            </h3>
          </div>

          <div className="py-1">
            <RatingStars rating={rating} reviews={reviews} />
          </div>

          <p className="text-gray-500 text-xs line-clamp-2 h-8">
            {product.description || 'No description available'}
          </p>

          <div className="flex gap-3 pt-2">
            <Link href={`/products/${product.id}`} className="flex-1">
              <AppButton
                variant="outline"
                className="w-full border-gray-200 hover:border-[#c9a96e] hover:bg-transparent hover:text-[#c9a96e] rounded-xl group/btn"
              >
                <EyeIcon className="w-5 h-5 text-gray-400 group-hover/btn:text-[#c9a96e]" />
              </AppButton>
            </Link>

            <AppButton
              variant="primary"
              className="flex-[2.5] bg-gray-900 hover:bg-black text-white rounded-xl shadow-lg shadow-gray-200 active:scale-95 transition-all"
              disabled={!isInStock}
              onClick={() => onAddToCart?.(product)}
            >
              <ShoppingCartIcon className="w-5 h-5 mr-2" />
              <span className="text-[11px] font-bold uppercase tracking-widest">
                {isInStock ? 'Add' : 'Out of stock'}
              </span>
            </AppButton>
          </div>
        </div>
      </div>

      <ProductImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageSrc={product.image}
        imageAlt={product.name}
      />
    </>
  );
};