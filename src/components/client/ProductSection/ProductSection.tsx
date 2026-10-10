'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Product } from '@/types/product';
import { ProductCard } from './ProductCard';
import { Category } from '@/types/category';
import { AppButton } from '../../ui/AppButton';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';

interface CategorySectionProps {
  category: Category;
  products: Product[];
}

// Helper to generate a subtle tagline based on category name
const getCategoryTagline = (categoryName: string) => {
  const taglines: Record<string, string> = {
    'New Arrivals': 'Fresh from the atelier',
    'Bestsellers': 'Customer favourites',
    'Accessories': 'The finishing touch',
    'Home & Living': 'Elevate your space',
    'Men': 'Modern masculinity',
    'Women': 'Timeless femininity',
  };
  return taglines[categoryName] || 'Curated selection';
};

const CategorySection = ({ category, products }: CategorySectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + 5 < maxScroll);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    updateArrows();
    return () => {
      container.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const firstChild = scrollRef.current.children[0] as HTMLElement;
    if (!firstChild) return;
    const itemWidth = firstChild.offsetWidth + 16; // gap-4 = 16px
    const scrollAmount = direction === 'left' ? -itemWidth : itemWidth;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  const tagline = getCategoryTagline(category.name);

  return (
    <section className="mb-20 relative px-4">
      {/* Category header with gold accent and elegant tagline */}
      <div className="flex items-center justify-between mb-8">
        <div className="group">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="text-xl md:text-2xl font-light text-gray-800 border-l-4 border-amber-500 pl-4 transition-all group-hover:border-amber-600">
              {category.name}
            </h2>
            <span className="text-xs text-gray-400 italic hidden sm:inline">
              {tagline}
            </span>
          </div>
          <div className="w-12 h-px bg-amber-300 mt-2 group-hover:w-24 transition-all duration-500" />
        </div>
        <Link href={`/Categories/${category.slug}`}>
          <AppButton
            variant="primary"
            className="rounded-full px-4 py-1.5 text-xs"
          >
            View all <span className="ml-1">→</span>
          </AppButton>
        </Link>
      </div>

      {/* Carousel with arrows always visible (disabled at ends) */}
      <div className="relative group -mx-4">
        {/* Scroll container with negative margin to eliminate outer padding */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 pb-4 pt-2 px-4 scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollSnapType: 'x mandatory',
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/80 backdrop-blur-md shadow-lg text-gray-700 transition-all duration-300 hover:bg-amber-500 hover:text-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white/80"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/80 backdrop-blur-md shadow-lg text-gray-700 transition-all duration-300 hover:bg-amber-500 hover:text-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white/80"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>
    </section>
  );
};

export default function ProductSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/ClientApi/product'),
          fetch('/api/ClientApi/categories'),
        ]);
        if (!productsRes.ok) throw new Error('Failed to fetch products');
        if (!categoriesRes.ok) throw new Error('Failed to fetch categories');

        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();

        const enrichedProducts = productsData.map((p: any) => ({
          ...p,
          id: Number(p.id),
          price: Number(p.price),
          oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
          stock: Number(p.stock),
          rating: Number(p.rating) || 0,
          reviews: Number(p.reviews) || 0,
          categoryId: Number(p.categoryId),
          inStock: Number(p.stock) > 0,
        }));

        setProducts(enrichedProducts);
        setCategories(categoriesData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-20 text-rose-600">
        {error}{' '}
        <button onClick={() => window.location.reload()} className="ml-2 underline">
          Retry
        </button>
      </div>
    );
  }

  const productsByCategory = products.reduce(
    (acc, product) => {
      const key = product.categoryId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(product);
      return acc;
    },
    {} as Record<number, Product[]>
  );

  const activeCategories = categories.filter(
    (cat) => productsByCategory[cat.id]?.length > 0
  );

  return (
    <div className="bg-white py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Global header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1 mb-5 text-[10px] font-bold tracking-[0.3em] uppercase bg-white/80 text-amber-600 rounded-full border border-amber-200/50 shadow-sm backdrop-blur-sm">
            Exclusive Selection
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-4 tracking-tight">
            Discover{' '}
            <span className="font-serif italic bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
              Elegance
            </span>
          </h1>
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto" />
          <p className="text-gray-500 mt-5 max-w-md mx-auto text-sm">
            Timeless pieces, curated for the modern connoisseur
          </p>
        </div>

        {/* Sections per category */}
        <div className="space-y-16">
          {activeCategories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              products={productsByCategory[category.id]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}