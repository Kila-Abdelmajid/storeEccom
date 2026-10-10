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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  // Update arrow states based on scroll position
  const updateArrows = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    // Add a small tolerance (1px) to avoid flickering
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft + 1 < maxScroll);
  }, []);

  // Attach scroll & resize listeners, and recalculate on category load
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Use passive listener for better performance
    container.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);

    // Initial update
    updateArrows();

    // Also update after categories are loaded (layout might shift)
    const timeout = setTimeout(updateArrows, 100);

    return () => {
      container.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
      clearTimeout(timeout);
    };
  }, [updateArrows, categories]); // Re-run when categories change

  // Scroll one card width + gap, then force arrow update after animation
  const scrollBy = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const firstChild = container.children[0] as HTMLElement;
    if (!firstChild) return;
    const itemWidth = firstChild.offsetWidth + 16; // width + gap (gap-4 = 16px)
    const scrollAmount = direction === 'left' ? -itemWidth : itemWidth;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });

    // Force arrows to update after the scroll finishes (smooth scroll takes ~300ms)
    // Use requestAnimationFrame to capture the final scroll position.
    let rafId: number;
    const checkScroll = () => {
      updateArrows();
      // Repeat a few times to catch the final position
      rafId = requestAnimationFrame(checkScroll);
    };
    // Start checking after a short delay to avoid excessive calls during the animation
    const timeout = setTimeout(() => {
      checkScroll();
      // Stop checking after ~400ms (smooth scroll should be done)
      setTimeout(() => {
        cancelAnimationFrame(rafId);
        updateArrows(); // final update
      }, 400);
    }, 50);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafId);
    };
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-white to-gray-50">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-500 font-light">Loading categories...</p>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50/30 overflow-hidden">
      <div className="container mx-auto px-4 md:px-12">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block px-5 py-1.5 mb-6 text-[11px] font-bold tracking-[0.3em] uppercase bg-white/80 text-amber-600 rounded-full border border-amber-200/50 shadow-sm backdrop-blur-sm">
            Shop by Category
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-4 tracking-tight">
            Explore{' '}
            <span className="font-serif italic bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
              Categories
            </span>
          </h2>
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto" />
          <p className="text-gray-500 mt-6 max-w-md mx-auto text-sm">
            Discover our curated collections
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Left arrow */}
          <button
            onClick={() => scrollBy('left')}
            disabled={!canScrollLeft}
            className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 backdrop-blur-md shadow-lg text-gray-700 transition-all duration-300 hover:bg-amber-500 hover:text-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white/80"
            aria-label="Scroll left"
          >
            <ChevronLeftIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Right arrow */}
          <button
            onClick={() => scrollBy('right')}
            disabled={!canScrollRight}
            className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 backdrop-blur-md shadow-lg text-gray-700 transition-all duration-300 hover:bg-amber-500 hover:text-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white/80"
            aria-label="Scroll right"
          >
            <ChevronRightIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Scroll container */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-4 pb-8 pt-2 px-1 scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollSnapType: 'x mandatory',
            }}
          >
            {categories.map((category, idx) => (
              <Link
                key={category.id}
                href={`/Categories/${category.slug}`}
                className="flex-shrink-0 w-36 md:w-44 group/card transition-all duration-300 hover:-translate-y-1 animate-fadeInUp"
                style={{
                  scrollSnapAlign: 'start',
                  animationDelay: `${idx * 0.05}s`,
                }}
              >
                <div className="relative">
                  <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden shadow-md group-hover/card:shadow-xl transition-all duration-300">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover/card:scale-110 transition-transform duration-500 ease-out"
                      sizes="(max-width: 768px) 144px, 176px"
                    />
                    <div className="absolute inset-0 rounded-full ring-0 group-hover/card:ring-2 ring-amber-400/60 ring-offset-0 transition-all duration-300" />
                  </div>
                  <div className="text-center mt-4">
                    <h3 className="font-medium text-gray-800 text-sm md:text-base group-hover/card:text-amber-600 transition-colors">
                      {category.name}
                    </h3>
                    <div className="flex items-center justify-center gap-1 mt-1 opacity-0 group-hover/card:opacity-100 transition-all duration-300 -translate-y-1 group-hover/card:translate-y-0">
                      <span className="text-xs text-amber-600 font-medium">Explore</span>
                      <ChevronRightIcon className="w-3 h-3 text-amber-600" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Decorative line */}
        <div className="flex justify-center mt-8 gap-2">
          <div className="w-8 h-px bg-amber-400/60 rounded-full" />
          <div className="w-12 h-px bg-amber-500 rounded-full" />
          <div className="w-8 h-px bg-amber-400/60 rounded-full" />
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          opacity: 0;
          animation: fadeInUp 0.5s ease forwards;
        }
      `}</style>
    </section>
  );
}