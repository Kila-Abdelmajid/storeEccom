'use client';

import { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { ProductCard } from '@/components/client/ProductSection/ProductCard';
import { Product } from '@/types/product';

export default function CategoryFilter({ products }: { products: Product[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('default');
  const [priceRange, setPriceRange] = useState({ min: 0, max: Math.max(...products.map(p => p.price), 1000) });
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [tempPriceMax, setTempPriceMax] = useState(priceRange.max);

  const maxPrice = useMemo(() => Math.max(...products.map(p => p.price), 100), [products]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (searchTerm.trim()) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    result = result.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);
    if (minRating > 0) result = result.filter(p => p.rating >= minRating);
    switch (sortBy) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'newest': result.sort((a, b) => b.id - a.id); break;
      default: break;
    }
    return result;
  }, [products, searchTerm, priceRange, minRating, sortBy]);

  const applyPrice = () => setPriceRange(prev => ({ ...prev, max: tempPriceMax }));
  const resetFilters = () => {
    setSearchTerm('');
    setSortBy('default');
    setPriceRange({ min: 0, max: maxPrice });
    setTempPriceMax(maxPrice);
    setMinRating(0);
  };
  const hasFilters = searchTerm !== '' || sortBy !== 'default' || priceRange.max !== maxPrice || minRating > 0;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Desktop filters – glassmorphic */}
      <div className="hidden lg:flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in this category..."
              className="pl-10 pr-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-slate-200 text-sm w-64 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 outline-none transition"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-white/50 backdrop-blur-sm border border-slate-200 rounded-full px-5 py-2 pr-10 text-sm font-medium focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 outline-none"
            >
              <option value="default">Sort: Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="newest">Newest First</option>
              <option value="rating">Top Rated</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Price range slider */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Max: ${priceRange.max}</span>
            <input
              type="range"
              min={0}
              max={maxPrice}
              value={tempPriceMax}
              onChange={(e) => setTempPriceMax(Number(e.target.value))}
              onMouseUp={applyPrice}
              onTouchEnd={applyPrice}
              className="w-40 h-1 bg-slate-200 rounded-lg accent-amber-500"
            />
          </div>

          {/* Rating filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Min stars:</span>
            {[5, 4, 3, 2, 1].map(star => (
              <button
                key={star}
                onClick={() => setMinRating(star)}
                className={`focus:outline-none transition-transform hover:scale-110 ${minRating >= star ? 'text-amber-400' : 'text-slate-300'}`}
              >
                <StarIcon className="w-5 h-5" />
              </button>
            ))}
            {minRating > 0 && (
              <button onClick={() => setMinRating(0)} className="text-xs text-slate-400 hover:text-amber-600">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Reset button */}
        {hasFilters && (
          <button onClick={resetFilters} className="text-sm text-amber-600 flex items-center gap-1 hover:text-amber-700 transition">
            <XMarkIcon className="w-4 h-4" /> Reset
          </button>
        )}
      </div>

      {/* Mobile filter toggle – glass card */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex justify-between items-center px-5 py-3 bg-white/60 backdrop-blur-sm border border-white/50 rounded-full shadow-sm"
        >
          <span className="font-medium flex items-center gap-2 text-slate-700">
            <FunnelIcon className="w-5 h-5" /> Filter & Sort
          </span>
          {showFilters ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
        </button>

        {showFilters && (
          <div className="mt-4 p-5 bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/50 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 bg-white/50 focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 bg-white/50"
              >
                <option value="default">Featured</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="newest">Newest First</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Max price: ${tempPriceMax}</label>
              <input
                type="range"
                min={0}
                max={maxPrice}
                value={tempPriceMax}
                onChange={(e) => setTempPriceMax(Number(e.target.value))}
                onMouseUp={applyPrice}
                className="w-full mt-2 accent-amber-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Min rating</label>
              <div className="flex gap-2 mt-1">
                {[5, 4, 3, 2, 1].map(star => (
                  <button
                    key={star}
                    onClick={() => setMinRating(star)}
                    className={`${minRating >= star ? 'text-amber-400' : 'text-slate-300'}`}
                  >
                    <StarIcon className="w-6 h-6" />
                  </button>
                ))}
              </div>
            </div>
            {hasFilters && (
              <button onClick={resetFilters} className="w-full py-2 bg-slate-100 rounded-xl font-medium text-slate-700">
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Result count */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-slate-500">
          Showing <span className="font-bold text-slate-900">{filtered.length}</span> of{' '}
          <span className="font-bold text-slate-900">{products.length}</span> products
        </p>
        {hasFilters && (
          <button onClick={resetFilters} className="hidden lg:block text-xs text-amber-600 hover:text-amber-700">
            Clear all filters
          </button>
        )}
      </div>

      {/* Products grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/50">
          <p className="text-slate-500 text-lg">No products match your filters.</p>
          <button
            onClick={resetFilters}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full shadow-md hover:shadow-lg transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}