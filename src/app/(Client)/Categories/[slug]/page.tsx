import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import sql from '@/lib/db';
import CategoryFilter from './CategoryFilter';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const [category] = await sql`
    SELECT categoryid, categoryname, categoryimage, slug
    FROM categories
    WHERE slug = ${slug}
  `;

  if (!category) notFound();

  const products = await sql`
    SELECT 
      p.productid as id,
      p.productname as name,
      p.description,
      p.price,
      p.oldprice as "oldPrice",
      p.stock,
      p.productimage as image,
      p.isnew as "isNew",
      COALESCE((SELECT AVG(rating)::float FROM reviews WHERE productid = p.productid), 0) as rating,
      COALESCE((SELECT COUNT(*) FROM reviews WHERE productid = p.productid), 0) as reviews
    FROM products p
    WHERE p.categoryid = ${category.categoryid}
    ORDER BY p.createdat DESC
  `;

  const formattedProducts = products.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
    stock: Number(p.stock),
    image: p.image,
    isNew: p.isNew,
    rating: Number(p.rating) || 0,
    reviews: Number(p.reviews) || 0,
    categoryId: category.categoryid,
    category: category.categoryname,
    additionalImages: [],
    deletedAt: null,
  }));

  return (
    <>
      {/* Hero Section – Floral, romantic, soft */}
      <section className="relative bg-gradient-to-br from-rose-50 via-white to-amber-50/30 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-0 w-64 h-64 bg-rose-200/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-white/30 to-transparent" />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative z-10">
          <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-12">
            {/* Left content */}
            <div className="flex-1 text-center lg:text-left space-y-5">
              <Link
                href="/#shop"
                className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 transition group text-sm font-medium"
              >
                <svg
                  className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Shop
              </Link>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-slate-800 tracking-tight leading-tight">
                {category.categoryname}
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full mx-auto lg:mx-0" />
              <p className="text-slate-600 text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Explore our curated collection of {category.categoryname.toLowerCase()} – where timeless elegance meets contemporary craftsmanship.
              </p>
              <div className="flex justify-center lg:justify-start gap-2 pt-2">
                <span className="w-2 h-2 rounded-full bg-amber-300/60" />
                <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                <span className="w-2 h-2 rounded-full bg-amber-300/60" />
              </div>
            </div>

            {/* Right side: Circular image with soft gold ring */}
            {category.categoryimage && (
              <div className="flex-shrink-0 relative group">
                <div className="absolute -inset-5 rounded-full bg-gradient-to-r from-amber-400/20 via-rose-400/20 to-amber-400/20 blur-2xl group-hover:blur-3xl transition duration-700" />
                <div className="relative w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-full overflow-hidden shadow-xl ring-4 ring-amber-400/30 group-hover:ring-amber-400/50 transition-all duration-500">
                  <Image
                    src={category.categoryimage}
                    alt={category.categoryname}
                    fill
                    className="object-cover group-hover:scale-110 transition duration-700 ease-out"
                    sizes="(max-width: 768px) 224px, (max-width: 1024px) 288px, 320px"
                    priority
                  />
                  <div className="absolute inset-0 rounded-full ring-2 ring-white/30 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom wave / fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Category filter – already elegantly styled */}
      <CategoryFilter products={formattedProducts} />
    </>
  );
}