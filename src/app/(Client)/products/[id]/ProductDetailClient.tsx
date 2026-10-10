'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
  ShoppingCartIcon,
  ShieldCheckIcon,
  TruckIcon,
  HeartIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { RatingStars } from '@/components/ui/RatingStars';
import { formatPrice } from '@/utils/format';
import { AppButton } from '@/components/ui/AppButton';
import ProductReviewsSection from '@/components/client/ProductReviewsSection/ProductReviewsSection';
import { triggerCartUpdate } from '@/lib/cartEvents';
import { useToast } from '@/contexts/ToastContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { ProductImageModal } from '@/components/ProductImageModal';

interface ProductDetailClientProps {
  product: {
    id: number;
    image: string;
    name: string;
    description: string;
    price: number;
    oldPrice: number | null;
    stock: number;
    isNew: boolean;
    categoryId: number;
    category: string;
    additionalImages: string[];
    rating: number;
    reviews: number;
  };
  currentUserId: number | null;
}

export default function ProductDetailClient({
  product,
  currentUserId,
}: ProductDetailClientProps) {
  const [adding, setAdding] = useState(false);
  const { showToast } = useToast();
  const { favorites, toggleFavorite, isLoading: favoritesLoading } = useFavorites();
  const isFavorite = favorites.has(product.id);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const isInStock = product.stock > 0;
  const allImages = [product.image, ...product.additionalImages];

  // Mount after client-side hydration (needed for portal)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  const handleAddToCart = async () => {
    if (!isInStock) return;
    setAdding(true);
    try {
      const res = await fetch('/api/ClientApi/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (res.ok) {
        triggerCartUpdate();
        showToast(`${product.name} added to cart`, 'success');
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to add', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentUserId) {
      showToast('Please login to add to favorites', 'error');
      return;
    }
    if (favoritesLoading) return;
    await toggleFavorite(product.id);
  };

  return (
    <>
      <div className="space-y-12">
        {/* Main product grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery Section - Enhanced with lightbox */}
          <div className="relative">
            <div className="relative bg-white/60 backdrop-blur-lg rounded-3xl p-5 shadow-2xl border border-white/60">
              {/* Main image */}
              <div 
                className="relative w-full aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => openLightbox(0)}
              >
                <Image
                  src={allImages[0]}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm transition-all">
                    Click to enlarge
                  </span>
                </div>
               
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                  {allImages.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 flex-shrink-0 border-2 ${
                        selectedImageIndex === idx ? 'border-amber-500' : 'border-transparent hover:border-amber-300'
                      }`}
                      onClick={() => openLightbox(idx)}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} ${idx + 1}`}
                        fill
                        className="object-cover hover:scale-110 transition-transform duration-300"
                        sizes="80px"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col space-y-7">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="text-amber-600 text-xs font-bold uppercase tracking-[0.2em] bg-amber-50/80 px-3 py-1 rounded-full">
                  {product.category}
                </span>
                {product.isNew && (
                  <span className="text-emerald-600 text-xs font-bold uppercase tracking-wide bg-emerald-50/80 px-3 py-1 rounded-full flex items-center gap-1">
                    <SparklesIcon className="w-3 h-3" />
                    New
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-semibold text-slate-800 leading-tight tracking-tight">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <RatingStars rating={product.rating} reviews={product.reviews} />
                <span className="h-4 w-px bg-slate-200" />
                <span
                  className={`text-sm font-semibold ${
                    isInStock ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  {isInStock ? '✓ In Stock' : '✗ Out of Stock'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-amber-600">
                  {formatPrice(product.price)}
                </span>
                {product.oldPrice && (
                  <span className="text-lg text-slate-400 line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
              </div>
              <p className="text-slate-600 leading-relaxed text-base border-l-3 border-amber-300 pl-4 italic">
                {product.description || 'A beautiful floral creation, crafted with love and care.'}
              </p>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <AppButton
                variant="primary"
                className="flex-[2.5] rounded-xl shadow-md hover:shadow-xl transition-all duration-300"
                disabled={!isInStock || adding}
                onClick={handleAddToCart}
              >
                <ShoppingCartIcon className="w-5 h-5 mr-2" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {adding ? 'Adding...' : isInStock ? 'Add to cart' : 'Out of stock'}
                </span>
              </AppButton>
              <button
                onClick={handleToggleFavorite}
                disabled={favoritesLoading}
                className={`flex-1 h-14 rounded-xl border-2 transition-all duration-300 flex items-center justify-center gap-2 group ${
                  isFavorite
                    ? 'border-rose-400 bg-rose-50 text-rose-600 shadow-sm'
                    : 'border-slate-200 bg-white/70 backdrop-blur-sm text-slate-600 hover:border-rose-300 hover:bg-rose-50/40'
                }`}
              >
                {isFavorite ? (
                  <>
                    <HeartSolid className="w-5 h-5 text-rose-500" />
                    <span className="text-sm font-medium">In Favorites</span>
                  </>
                ) : (
                  <>
                    <HeartIcon className="w-5 h-12 group-hover:text-rose-500 transition-colors" />
                    <span className="text-sm font-medium">Save to Favorites</span>
                  </>
                )}
              </button>
            </div>

            {/* Shipping & Warranty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 shadow-md transition-all hover:shadow-lg">
                <div className="p-2 rounded-full bg-amber-100 mr-4">
                  <TruckIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Free Delivery</h4>
                  <p className="text-xs text-slate-500">On orders over 200 DH</p>
                </div>
              </div>
              <div className="flex items-center p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 shadow-md transition-all hover:shadow-lg">
                <div className="p-2 rounded-full bg-amber-100 mr-4">
                  <ShieldCheckIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">3 month Warranty</h4>
                  <p className="text-xs text-slate-500">Official brand coverage</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="relative mt-12">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-50/40 to-transparent rounded-3xl -z-10" />
          <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-inner border border-white/50">
            <ProductReviewsSection productId={product.id} currentUserId={currentUserId} />
          </div>
        </div>
      </div>

      {/* Lightbox Modal – rendered via Portal to ensure it's on top */}
      {mounted &&
        createPortal(
          <ProductImageModal
            isOpen={isLightboxOpen}
            onClose={() => setIsLightboxOpen(false)}
            imageSrc={allImages[selectedImageIndex]}
            imageAlt={product.name}
          />,
          document.body
        )}
    </>
  );
}