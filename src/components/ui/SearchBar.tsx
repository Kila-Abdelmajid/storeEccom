'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/utils/format';
import { useDebounce } from 'use-debounce';

interface SearchResult {
  id: number;
  name: string;
  price: number;
  oldPrice: number | null;
  image: string;
  rating: number;
  stock: number;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery] = useDebounce(query, 200);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search effect
  useEffect(() => {
    const search = async () => {
      if (debouncedQuery.length === 0) {
        setResults([]);
        setLoading(false);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      setIsOpen(true);
      try {
        const res = await fetch(`/api/ClientApi/search?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setResults(data);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedQuery]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.round(rating);
    return [...Array(5)].map((_, i) =>
      i < fullStars ? (
        <StarSolid key={i} className="w-3 h-3 text-amber-400" />
      ) : (
        <StarIcon key={i} className="w-3 h-3 text-slate-300" />
      )
    );
  };

  // Determine if we should show the dropdown
  const shouldShowDropdown = isOpen && (
    loading ||
    results.length > 0 ||
    (debouncedQuery.length > 0 && !loading && results.length === 0)
  );

  return (
    <div className="relative w-full max-w-md">
      <div className="relative group">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search products..."
          className="w-full pl-10 pr-10 py-2.5 rounded-full bg-white/50 backdrop-blur-sm border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:bg-white/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 outline-none transition-all duration-300"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <XMarkIcon className="w-4 h-4 text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>

      {/* Dropdown results – glassmorphic card */}
      {shouldShowDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden z-50 animate-fadeInUp"
        >
          <div className="max-h-96 overflow-y-auto custom-scroll">
            {loading ? (
              // Skeleton loader
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium">No products found</p>
                <p className="text-xs text-slate-400 mt-1">
                  We couldn't find any products matching "<span className="font-mono text-amber-600">{debouncedQuery}</span>"
                </p>
              </div>
            ) : (
              <div>
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-amber-50/30 transition-colors border-b border-slate-100 last:border-0 group"
                  >
                    <div className="w-12 h-12 relative bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 truncate group-hover:text-amber-600 transition-colors">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1">{renderStars(product.rating)}</div>
                        {product.stock > 0 ? (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">In stock</span>
                        ) : (
                          <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">Out</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-amber-600">{formatPrice(product.price)}</div>
                      {product.oldPrice && (
                        <div className="text-xs text-slate-400 line-through">{formatPrice(product.oldPrice)}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.2s ease-out;
        }
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #c9a96e;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}