// app/components/ProductSection.tsx
'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
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

const CategorySection = ({ category, products }: CategorySectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const containerWidth = scrollRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const cardWidth = isMobile ? containerWidth : containerWidth / 4;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -cardWidth : cardWidth,
      behavior: 'smooth',
    });
  };

  const handleScrollStatus = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScrollStatus);
      handleScrollStatus();
      return () => el.removeEventListener('scroll', handleScrollStatus);
    }
  }, [handleScrollStatus]);

  if (products.length === 0) return null;

  return (
    <section className="mb-24 relative px-4 md:px-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900 border-l-4 border-[#c9a96e] pl-4">
          {category.name}
        </h2>
        <Link href={`/categories/${category.name}`}>
          <AppButton variant="primary">see all products</AppButton>
        </Link>
      </div>

      <div className="relative group">
        <button
          onClick={() => scroll('left')}
          className={`absolute -left-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white shadow-xl text-gray-800 transition-all hover:bg-[#c9a96e] hover:text-white ${
            !showLeftArrow ? 'opacity-0 invisible' : 'opacity-100 visible'
          }`}
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>

        <button
          onClick={() => scroll('right')}
          className={`absolute -right-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white shadow-xl text-gray-800 transition-all hover:bg-[#c9a96e] hover:text-white ${
            isAtEnd ? 'opacity-0 invisible' : 'opacity-100 visible'
          }`}
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-full md:w-1/4 px-2 snap-start"
            >
              <ProductCard product={product} categoryName={category.name} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default  function ProductSection() {
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

        // Normalise products: ensure numeric fields and categoryId is number
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
    return <div className="text-center py-20 text-gray-500">Loading products...</div>;
  }
  if (error) {
    return (
      <div className="text-center py-20 text-red-600">
        {error}{' '}
        <button onClick={() => window.location.reload()} className="ml-2 underline">
          Retry
        </button>
      </div>
    );
  }

  // Group products by categoryId – now categoryId is guaranteed number
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
    <div className="bg-[#FFFFFF] py-24">
      <div className="max-w-[1500px] mx-auto overflow-hidden">
        <div className="px-6 md:px-12 mb-24 text-center">
          <span className="inline-block px-4 py-1.5 mb-6 text-[10px] font-bold tracking-[0.4em] uppercase bg-gray-50 text-gray-400 rounded-full border border-gray-100">
            Exclusive Selection
          </span>
          <h1 className="text-5xl md:text-7xl font-light text-gray-900 mb-6">
            Discover <span className="font-serif italic text-[#c9a96e]">Elegance</span>
          </h1>
          <div className="h-px w-24 bg-gray-200 mx-auto" />
        </div>

        <div className="space-y-12">
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