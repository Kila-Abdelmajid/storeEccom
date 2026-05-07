'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AppButton } from '../../ui/AppButton'

/* ── Slide data (you can replace image paths) ── */
const SLIDES = [
  {
    id: 1,
    src: '/photos/image1.png',
    alt: 'Autumn Collection — curated pieces for the modern wardrobe',
    tag: 'New Season',
    title: 'Autumn\nCollection',
    description:
      'Curated pieces crafted for the discerning taste — where refined aesthetics meet uncompromising quality.',
    cta: { primary: 'Shop Now', href: '/products?collection=autumn' },
    cta2: { label: 'Explore Lookbook', href: '/lookbook' },
    accent: 'from-[#2a1a0e]/70 via-[#2a1a0e]/30 to-transparent',
    gradient: 'linear-gradient(135deg, #3d2b1f 0%, #7a5c44 100%)',
  },
  {
    id: 2,
    src: '/photos/image2.png',
    alt: 'Signature Accessories — handcrafted leather goods and fine jewellery',
    tag: 'Bestsellers',
    title: 'Signature\nAccessories',
    description:
      'Handcrafted leather goods and fine jewellery that tell a story — timeless companions for every occasion.',
    cta: {
      primary: 'Shop Accessories',
      href: '/products?category=accessories',
    },
    cta2: { label: 'View All', href: '/products' },
    accent: 'from-[#0e1a2a]/70 via-[#0e1a2a]/30 to-transparent',
    gradient: 'linear-gradient(135deg, #1a2d3d 0%, #3d5c7a 100%)',
  },
  {
    id: 3,
    src: '/photos/image3.png',
    alt: 'Home & Living — artisanal objects for considered interiors',
    tag: 'Limited Edition',
    title: 'Home &\nLiving',
    description:
      'Artisanal objects for considered interiors — each piece selected for beauty, function, and lasting craft.',
    cta: { primary: 'Discover More', href: '/products?category=home' },
    cta2: { label: 'Our Story', href: '/about' },
    accent: 'from-[#1a200e]/70 via-[#1a200e]/30 to-transparent',
    gradient: 'linear-gradient(135deg, #2a3d1a 0%, #5c7a44 100%)',
  },
] as const

const INTERVAL_MS = 5000

export default function HeroSlider() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback(
    (index: number, dir: 'next' | 'prev') => {
      if (animating) return
      setAnimating(true)
      setDirection(dir)
      setProgress(0)
      setTimeout(() => {
        setCurrent(index)
        setAnimating(false)
      }, 700) // matches transition duration
    },
    [animating],
  )

  const next = useCallback(() => {
    goTo((current + 1) % SLIDES.length, 'next')
  }, [current, goTo])

  const prev = useCallback(() => {
    goTo((current - 1 + SLIDES.length) % SLIDES.length, 'prev')
  }, [current, goTo])

  /* Auto-advance */
  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(next, INTERVAL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [paused, next])

  /* Progress bar */
  useEffect(() => {
    if (paused) return
    setProgress(0)
    const step = 100 / (INTERVAL_MS / 50)
    progressRef.current = setInterval(
      () => setProgress((p) => Math.min(p + step, 100)),
      50,
    )
    return () => {
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [current, paused])

  /* Keyboard navigation */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next])

  const slide = SLIDES[current]

  return (
    <section
      aria-label='Featured collections'
      aria-roledescription='carousel'
      className='relative w-full overflow-hidden'
      style={{ height: 'min(92vh, 780px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Background image / gradient fallback with improved transition ── */}
      <div
        key={slide.id}
        className='absolute inset-0 transition-all duration-700 ease-out'
        style={{
          transform: animating
            ? direction === 'next'
              ? 'scale(1.05)'
              : 'scale(0.95)'
            : 'scale(1)',
          opacity: animating ? 0.4 : 1,
          filter: animating ? 'blur(3px)' : 'blur(0px)',
        }}
      >
        <div
          className='absolute inset-0'
          style={{ background: slide.gradient }}
          aria-hidden='true'
        />
        <Image
          src={slide.src}
          alt={slide.alt}
          fill
          priority={current === 0}
          sizes='100vw'
          className='object-cover'
          onError={() => {}}
        />
        <div
          className={`absolute inset-0 bg-linear-to-r ${slide.accent}`}
          aria-hidden='true'
        />
        <div
          className='absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent'
          aria-hidden='true'
        />
      </div>

      {/* ── Content with staggered reveal animation ── */}
      <div className='relative z-10 h-full flex items-end pb-20 md:pb-24 lg:pb-28'>
        <div className='max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full'>
          <div className='max-w-xl'>
            {/* Tag */}
            <div
              className='animate-stagger-1'
              style={{
                animation: animating
                  ? 'none'
                  : 'fadeInUp 0.6s ease-out forwards',
              }}
            >
              <span
                className='inline-block text-xs tracking-[0.2em] uppercase font-medium px-3 py-1 rounded-full mb-5 backdrop-blur-sm'
                style={{
                  background: 'rgba(201,169,110,0.2)',
                  border: '1px solid rgba(201,169,110,0.5)',
                  color: '#f0e6d2',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
              >
                {slide.tag}
              </span>
            </div>

            {/* Title */}
            <h1
              className='animate-stagger-2 font-display text-5xl sm:text-6xl lg:text-7xl font-light leading-none text-white mb-5 whitespace-pre-line'
              style={{
                textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                animation: animating
                  ? 'none'
                  : 'fadeInUp 0.6s ease-out 0.1s forwards',
                opacity: 0,
                transform: 'translateY(20px)',
              }}
            >
              {slide.title}
            </h1>

            {/* Description */}
            <p
              className='animate-stagger-3 text-sm sm:text-base leading-relaxed mb-8 max-w-sm'
              style={{
                color: 'rgba(255,255,255,0.85)',
                animation: animating
                  ? 'none'
                  : 'fadeInUp 0.6s ease-out 0.2s forwards',
                opacity: 0,
                transform: 'translateY(20px)',
              }}
            >
              {slide.description}
            </p>

            {/* CTAs */}
            <div className='flex flex-wrap gap-3 mt-8'>
              <Link href={slide.cta.href}>
                <AppButton variant='primary' size='md'>
                  {slide.cta.primary}
                </AppButton>
              </Link>

              <Link href={slide.cta2.href}>
                <AppButton variant='outline' size='md'>
                  {slide.cta2.label}
                </AppButton>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation arrows (enhanced hover) ── */}
      <div className='absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none z-20 px-3 sm:px-5'>
        <button
          onClick={prev}
          aria-label='Previous slide'
          className='pointer-events-auto flex items-center justify-center w-11 h-11 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-gold/40'
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff',
          }}
        >
          <ChevronLeft size={20} aria-hidden='true' />
        </button>

        <button
          onClick={next}
          aria-label='Next slide'
          className='pointer-events-auto flex items-center justify-center w-11 h-11 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-gold/40'
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff',
          }}
        >
          <ChevronRight size={20} aria-hidden='true' />
        </button>
      </div>

      {/* ── Dot indicators with smooth scaling + slide counter ── */}
      <div className='absolute bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3'>
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i, i > current ? 'next' : 'prev')}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === current ? 'true' : undefined}
            className='transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gold/50'
            style={{
              width: i === current ? '28px' : '8px',
              height: '8px',
              background: i === current ? '#c9a96e' : 'rgba(255,255,255,0.45)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
        {/* Optional slide counter */}
        <span className='ml-4 text-xs font-mono text-white/60 tracking-wider'>
          {String(current + 1).padStart(2, '0')} /{' '}
          {String(SLIDES.length).padStart(2, '0')}
        </span>
      </div>

      {/* ── Auto-play progress bar ── */}
      <div
        className='absolute bottom-0 left-0 h-0.5 z-20 transition-none'
        style={{
          width: `${progress}%`,
          background: '#c9a96e',
          transition: paused ? 'none' : 'width 50ms linear',
        }}
        aria-hidden='true'
      />

      {/* ── Live region for screen readers ── */}
      <div aria-live='polite' aria-atomic='true' className='sr-only'>
        {`Slide ${current + 1} of ${SLIDES.length}: ${slide.title.replace('\n', ' ')}`}
      </div>

      {/* ── Global animations & button styles ── */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .btn-gold {
          background: linear-gradient(135deg, #c9a96e 0%, #b58b4a 100%);
          border: none;
          color: #1e1a14;
          font-weight: 500;
          padding: 0.75rem 1.8rem;
          border-radius: 2.5rem;
          font-size: 0.9rem;
          letter-spacing: 0.02em;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .btn-gold:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.2);
          filter: brightness(1.05);
        }

        .btn-outline {
          background: transparent;
          border: 1.5px solid rgba(255, 255, 255, 0.6);
          color: white;
          padding: 0.75rem 1.8rem;
          border-radius: 2.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
        }

        .btn-outline:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        /* Custom scrollbar (optional) */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        ::-webkit-scrollbar-thumb {
          background: #c9a96e;
          border-radius: 3px;
        }
      `}</style>
    </section>
  )
}
