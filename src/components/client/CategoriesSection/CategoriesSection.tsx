'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  image: string;
  slug: string;
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/ClientApi/categories');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // Reorder forward (first to end) – used when reaching right edge
  const shiftLeftToRight = useCallback(() => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    setCategories(prev => {
      if (prev.length === 0) return prev;
      const first = prev[0];
      const newList = [...prev.slice(1), first];
      const container = scrollContainerRef.current;
      if (container) {
        const firstChild = container.children[0] as HTMLElement;
        if (firstChild) {
          const itemWidth = firstChild.offsetWidth + 24; // w-44 = 176px? gap-6 = 24px
          container.scrollLeft -= itemWidth;
        }
      }
      return newList;
    });
    setTimeout(() => { isUpdatingRef.current = false; }, 150);
  }, []);

  // Reorder backward (last to beginning) – used when reaching left edge
  const shiftRightToLeft = useCallback(() => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    setCategories(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const newList = [last, ...prev.slice(0, -1)];
      const container = scrollContainerRef.current;
      if (container) {
        const firstChild = container.children[0] as HTMLElement;
        if (firstChild) {
          const itemWidth = firstChild.offsetWidth + 24;
          container.scrollLeft += itemWidth;
        }
      }
      return newList;
    });
    setTimeout(() => { isUpdatingRef.current = false; }, 150);
  }, []);

  // Handle scroll events to trigger reorder and update arrow visibility
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (isUpdatingRef.current) return;

    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const threshold = 100;

    // Update arrows visibility (similar to ProductSection)
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft + container.clientWidth < container.scrollWidth - 20);

    // Reorder when near edges
    if (scrollLeft + threshold >= maxScroll) {
      shiftLeftToRight();
    } else if (scrollLeft <= threshold) {
      shiftRightToLeft();
    }
  }, [shiftLeftToRight, shiftRightToLeft]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll);
    handleScroll(); // initial check
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Manual scroll with buttons (smooth, using card width)
  const scrollBy = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const firstChild = container.children[0] as HTMLElement;
    if (!firstChild) return;
    const itemWidth = firstChild.offsetWidth + 24; // width + gap
    const scrollAmount = direction === 'left' ? -itemWidth : itemWidth;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center py-16">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-[#c9a96e] border-t-transparent" />
          <p className="mt-4 text-gray-500">Loading categories...</p>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-12">
        {/* Header - same style as ProductSection */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 mb-6 text-[10px] font-bold tracking-[0.4em] uppercase bg-gray-50 text-gray-400 rounded-full border border-gray-100">
            Shop by Category
          </span>
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">
            Explore <span className="font-serif italic text-[#c9a96e]">Categories</span>
          </h2>
          <div className="h-px w-20 bg-gray-200 mx-auto" />
        </div>

        {/* Carousel with buttons - matches ProductSection styling */}
        <div className="relative group">
          {/* Left Button */}
          <button
            onClick={() => scrollBy('left')}
            className={`absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-white shadow-xl text-gray-800 transition-all hover:bg-[#c9a96e] hover:text-white focus:outline-none ${
              showLeftArrow ? 'opacity-100 visible' : 'opacity-0 invisible'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeftIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Right Button */}
          <button
            onClick={() => scrollBy('right')}
            className={`absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-white shadow-xl text-gray-800 transition-all hover:bg-[#c9a96e] hover:text-white focus:outline-none ${
              showRightArrow ? 'opacity-100 visible' : 'opacity-0 invisible'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRightIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Scroll container */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-6 pb-8 pt-2 px-2 scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollSnapType: 'none',
            }}
          >
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${encodeURIComponent(category.name.toLowerCase())}`}
                className="flex-shrink-0 w-44 md:w-52 group/card transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative">
                  {/* Image circulaire avec cadre élégant */}
                  <div className="relative w-44 h-44 md:w-52 md:h-52 rounded-full overflow-hidden shadow-md group-hover/card:shadow-xl transition-all duration-300">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover/card:scale-110 transition-transform duration-500 ease-out"
                      sizes="(max-width: 768px) 176px, 208px"
                    />
                    {/* Cercle intérieur gold au hover */}
                    <div className="absolute inset-0 rounded-full ring-0 group-hover/card:ring-2 ring-[#c9a96e]/50 ring-offset-0 transition-all duration-300" />
                  </div>
                  {/* Nom de catégorie avec soulignement gold au hover */}
                  <div className="text-center mt-5">
                    <h3 className="font-medium text-gray-800 text-base md:text-lg group-hover/card:text-[#c9a96e] transition-colors">
                      {category.name}
                    </h3>
                    <div className="flex items-center justify-center gap-1 mt-1 opacity-0 group-hover/card:opacity-100 transition-all duration-300 -translate-y-1 group-hover/card:translate-y-0">
                      <span className="text-xs text-[#c9a96e] font-medium">Explore</span>
                      <ChevronRightIcon className="w-3 h-3 text-[#c9a96e]" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Dots indicator minimal (optional) */}
        <div className="flex justify-center mt-6 gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e]/50 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e]/70 animate-pulse delay-75" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e] animate-pulse delay-150" />
        </div>
      </div>
    </section>
  );
}