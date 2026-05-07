# Maison — E-Commerce Starter

A premium Next.js 15 e-commerce starter with App Router, TypeScript, Tailwind CSS, and React Compiler.

---

## 📁 File Structure

```
maison-ecommerce/
├── next.config.ts                  ← Security headers, image optimisation, React Compiler
├── tailwind.config.ts              ← Design tokens (colors, fonts, animations)
├── tsconfig.json                   ← Strict TS + @/* path alias
├── postcss.config.mjs
├── package.json
└── src/
    ├── app/
    │   ├── globals.css             ← Design system CSS (variables, animations, utilities)
    │   ├── layout.tsx              ← Root layout + CartProvider + metadata
    │   └── page.tsx                ← Home page (Header + HeroSlider)
    ├── components/
    │   ├── layout/
    │   │   └── Header.tsx          ← Logo, nav, search, lang switcher, cart, profile
    │   ├── sections/
    │   │   └── HeroSlider.tsx      ← 3-slide hero, auto-advance 5 s, < / > arrows
    │   └── ui/
    │       └── CartDrawer.tsx      ← Slide-in cart panel
    └── context/
        └── CartContext.tsx         ← Cart state (add, remove, update qty)
```

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

---

## 🖼 Hero Images

Add three images to `/public/images/`:

```
public/
└── images/
    ├── hero-1.jpg   ← Autumn Collection
    ├── hero-2.jpg   ← Signature Accessories
    └── hero-3.jpg   ← Home & Living
```

**Recommended size:** 1920 × 1080 px (16:9). The hero gracefully falls back to colour gradients if images are absent.

---

## 🔒 Security

All HTTP security headers are applied in `next.config.ts`:

| Header | Value |
|---|---|
| `Content-Security-Policy` | Strict, no `unsafe-eval` in production |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera, mic, geolocation disabled |

---

## ⚡ Performance

- **React Compiler** — enabled via `experimental.reactCompiler`
- **Next/Image** — AVIF + WebP, lazy loading, responsive `srcSet`
- **Package optimisation** — `lucide-react` tree-shaken automatically
- **CSS transitions** — CSS-only animations (no JS animation libraries needed)
- **`passive` scroll listeners** — scroll handler in Header uses `{ passive: true }`

---

## ♿ Accessibility

- Semantic `<header>`, `<nav>`, `<section>`, `<article>` landmarks
- `aria-label`, `aria-current`, `aria-live`, `aria-expanded` throughout
- Screen-reader announcer for active hero slide
- Keyboard arrow-key navigation in HeroSlider
- Focus trap in CartDrawer
- All interactive elements have visible focus rings