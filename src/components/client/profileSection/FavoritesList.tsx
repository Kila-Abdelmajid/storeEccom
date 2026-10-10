'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useToast } from '@/contexts/ToastContext';

interface FavoriteProduct {
  id: number;
  name: string;
  price: number;
  oldPrice: number | null;
  image: string;
  rating: number;
  stock: number;
}

export default function FavoritesList() {
  const { favorites, toggleFavorite } = useFavorites();
  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const fetchFavoriteProducts = async () => {
    if (favorites.size === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ClientApi/favorites');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        showToast('Failed to load favorites', 'error');
      }
    } catch {
      showToast('Error loading favorites', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoriteProducts();
  }, [favorites]);

  const handleRemove = async (productId: number) => {
    setRemovingId(productId);
    await toggleFavorite(productId);
    setRemovingId(null);
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <StarIcon key={i} className={`w-3.5 h-3.5 ${i < fullStars ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
        ))}
        <span className="text-xs text-slate-500 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50">
        <HeartSolid className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No favorites yet</p>
        <Link href="/#shop" className="inline-block mt-2 text-amber-600 text-sm hover:underline">
          Browse products →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {products.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-white/50 overflow-hidden"
          >
            <Link href={`/products/${item.id}`} className="block">
              <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                  <HeartSolid className="w-4 h-4 text-rose-500" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 truncate group-hover:text-amber-600 transition-colors">
                  {item.name}
                </h3>
                <div className="mt-1">{renderStars(item.rating)}</div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-xl font-bold text-amber-600">{formatPrice(item.price)}</span>
                  {item.oldPrice && (
                    <span className="text-sm text-slate-400 line-through">{formatPrice(item.oldPrice)}</span>
                  )}
                </div>
              </div>
            </Link>
            <button
              onClick={() => handleRemove(item.id)}
              disabled={removingId === item.id}
              className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md transition-all duration-200 hover:bg-rose-500 hover:text-white focus:outline-none disabled:opacity-50"
              title="Remove from favorites"
            >
              {removingId === item.id ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <TrashIcon className="w-4 h-4" />
              )}
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}