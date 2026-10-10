import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  allowedDevOrigins: ['192.168.56.1', 'localhost', '4kbc18sg-3000.uks1.devtunnels.ms', ],
}
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self'${isDev ? " 'unsafe-eval'" : ''};
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https:;
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`.replace(/\n/g, ' ').trim()

const securityHeaders = [
  { key: 'Content-Security-Policy',          value: ContentSecurityPolicy },
  { key: 'X-Frame-Options',                  value: 'DENY' },
  { key: 'X-Content-Type-Options',           value: 'nosniff' },
  { key: 'Referrer-Policy',                  value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',               value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security',        value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-DNS-Prefetch-Control',           value: 'on' },
]

const nextConfig: NextConfig = {
  /* ── Security ── */
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },

  /* ── Performance ── */
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },

  compress: true,
  poweredByHeader: false,

  experimental: {
    optimizePackageImports: ['lucide-react'],
    
  },
  
}

export default nextConfig
