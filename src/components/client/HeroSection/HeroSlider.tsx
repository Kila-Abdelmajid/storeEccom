'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Slide data – flower boutique theme ─────────────────────────────────
const SLIDES = [
  {
    id: 1,
    src: '/photos/flower2.jpg',               // replace with your flower image
    alt: 'Fresh seasonal bouquet — hand-picked garden roses and eucalyptus',
    tag: 'Fresh Picks',
    title: 'Seasonal\nBouquets',
    description:
      'Hand-arranged blooms sourced daily from local growers. Each bouquet tells a story of freshness and artistry.',
    cta: { primary: 'Shop Now', href: '/#shop' },
    cta2: { label: 'Read Reviews', href: '/#reviews' },
    overlay: 'from-black/60 via-black/30 to-transparent',
    accent: 'from-rose-900/30 via-rose-800/10 to-transparent',
  },
  {
    id: 2,
    src: '/photos/flowers1.jpg',
    alt: 'Elegant bridal bouquet — white peonies and delicate gypsophila',
    tag: 'Wedding Collection',
    title: 'Bridal\nElegance',
    description:
      'Custom-designed wedding arrangements that capture the beauty of your special day. Consult with our floral artists.',
    cta: { primary: 'Shop Now', href: '/#shop' },
    cta2: { label: 'Contact Us', href: '/#contact' },
    overlay: 'from-slate-900/60 via-slate-800/30 to-transparent',
    accent: 'from-indigo-900/30 via-indigo-800/10 to-transparent',
  },
  {
    id: 3,
    src: '/photos/flower3.jpg',
    alt: 'Luxury flower box — preserved roses and orchids in a designer box',
    tag: 'Luxury Edition',
    title: 'Forever\nRoses',
    description:
      'Premium preserved roses that last over a year. The perfect timeless gift for someone extraordinary.',
    cta: { primary: 'Discover More', href: '/#shop' },
    cta2: { label: 'View Collection', href: '/#shop' },
    overlay: 'from-emerald-900/60 via-emerald-800/30 to-transparent',
    accent: 'from-emerald-900/30 via-emerald-800/10 to-transparent',
  },
] as const;

const INTERVAL_MS = 6000;
const TRANSITION_DURATION = 800;

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const slide = SLIDES[current];

  const goTo = useCallback(
    (index: number, dir: 'next' | 'prev') => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setDirection(dir);
      setProgress(0);
      setTimeout(() => {
        setCurrent(index);
        setTimeout(() => setIsTransitioning(false), 50);
      }, TRANSITION_DURATION);
    },
    [isTransitioning]
  );

  const next = useCallback(() => {
    goTo((current + 1) % SLIDES.length, 'next');
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + SLIDES.length) % SLIDES.length, 'prev');
  }, [current, goTo]);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, next]);

  // Progress bar
  useEffect(() => {
    if (paused) return;
    setProgress(0);
    const step = 100 / (INTERVAL_MS / 50);
    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + step, 100));
    }, 50);
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [current, paused]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  // Touch/swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) prev();
      else next();
    }
  };

  return (
    <section
      aria-label="Featured floral collections"
      className="relative w-full overflow-hidden bg-black"
      style={{ height: 'min(90vh, 800px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background image with smooth scale/opacity transition */}
      <div
        key={slide.id}
        className="absolute inset-0 transition-all duration-700 ease-out will-change-transform"
        style={{
          transform: isTransitioning
            ? direction === 'next'
              ? 'scale(1.08)'
              : 'scale(0.92)'
            : 'scale(1)',
          opacity: isTransitioning ? 0.6 : 1,
        }}
      >
        <Image
          src={slide.src}
          alt={slide.alt}
          fill
          priority={current === 0}
          sizes="100vw"
          
        />
        {/* Gradient overlays */}
        <div
          className={`absolute inset-0 bg-gradient-to-t ${slide.overlay}`}
          aria-hidden="true"
        />
        <div
          className={`absolute inset-0 bg-gradient-to-r ${slide.accent}`}
          aria-hidden="true"
        />
      </div>

      {/* Content container */}
      <div className="relative z-10 h-full flex items-end pb-16 md:pb-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
          <div className="max-w-xl">
            {/* Tag – elegant flower badge */}
            <div
              className="transition-all duration-700 delay-100"
              style={{
                opacity: isTransitioning ? 0 : 1,
                transform: isTransitioning ? 'translateY(20px)' : 'translateY(0)',
              }}
            >
              <span
                className="inline-block text-xs tracking-[0.2em] uppercase font-medium px-3 py-1 rounded-full mb-5 backdrop-blur-md"
                style={{
                  background: 'rgba(201,169,110,0.15)',
                  border: '1px solid rgba(201,169,110,0.6)',
                  color: '#f5e6d3',
                }}
              >
                {slide.tag}
              </span>
            </div>

            {/* Title – gold gradient + text shadow */}
            <h1
              className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light leading-[1.1] mb-5 whitespace-pre-line transition-all duration-700 delay-200"
              style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                opacity: isTransitioning ? 0 : 1,
                transform: isTransitioning ? 'translateY(30px)' : 'translateY(0)',
              }}
            >
              {slide.title}
            </h1>

            {/* Description */}
            <p
              className="text-sm sm:text-base leading-relaxed mb-8 max-w-sm text-white/80 transition-all duration-700 delay-300"
              style={{
                opacity: isTransitioning ? 0 : 1,
                transform: isTransitioning ? 'translateY(20px)' : 'translateY(0)',
              }}
            >
              {slide.description}
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-wrap gap-4 mt-6 transition-all duration-700 delay-400"
              style={{
                opacity: isTransitioning ? 0 : 1,
                transform: isTransitioning ? 'translateY(20px)' : 'translateY(0)',
              }}
            >
              <Link href={slide.cta.href}>
                <button className="group relative overflow-hidden px-6 py-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-white font-medium shadow-lg transition-all duration-300 hover:shadow-amber-500/20 hover:scale-105 active:scale-95">
                  <span className="relative z-10">{slide.cta.primary}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </Link>
              <Link href={slide.cta2.href}>
                <button className="px-6 py-3 rounded-full border border-white/40 text-white font-medium backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/80 hover:scale-105 active:scale-95">
                  {slide.cta2.label}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none z-20 px-4 sm:px-6">
        <button
          onClick={prev}
          aria-label="Previous slide"
          className="pointer-events-auto flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-white transition-all duration-300 hover:bg-amber-500/40 hover:scale-110 hover:border-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          className="pointer-events-auto flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-white transition-all duration-300 hover:bg-amber-500/40 hover:scale-110 hover:border-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Dot indicators + counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > current ? 'next' : 'prev')}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === current ? 'true' : undefined}
            className="transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            style={{
              width: i === current ? '28px' : '8px',
              height: '8px',
              background: i === current ? '#c9a96e' : 'rgba(255,255,255,0.4)',
            }}
          />
        ))}
        <span className="ml-3 text-xs font-mono text-white/60 tracking-wider">
          {String(current + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
        </span>
      </div>

      {/* Auto-play progress bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 z-20 transition-none"
        style={{
          width: `${progress}%`,
          background: '#c9a96e',
          transition: paused ? 'none' : 'width 50ms linear',
        }}
        aria-hidden="true"
      />

      {/* Screen reader live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Slide {current + 1} of {SLIDES.length}: {slide.title.replace('\n', ' ')}
      </div>
    </section>
  );
}