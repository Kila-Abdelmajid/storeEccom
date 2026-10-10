import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import ProductDetailClient from './ProductDetailClient';

type Params = Promise<{ id: string }>;

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const productId = parseInt(id);

  const [product]: any[] = await sql`
    SELECT 
      p.productid as id,
      p.productimage as image,
      p.productname as name,
      p.description,
      p.price,
      p.oldprice as "oldPrice",
      p.stock,
      p.isnew as "isNew",
      p.categoryid as "categoryId",
      c.categoryname as category,
      COALESCE(
        (SELECT json_agg(imagepath) FROM productimages WHERE productid = p.productid),
        '[]'::json
      ) as "additionalImages",
      COALESCE(
        (SELECT AVG(rating)::float FROM reviews WHERE productid = p.productid), 0
      ) as rating,
      COALESCE(
        (SELECT COUNT(*) FROM reviews WHERE productid = p.productid), 0
      ) as reviews
    FROM products p
    LEFT JOIN categories c ON p.categoryid = c.categoryid
    WHERE p.productid = ${productId}
  `;

  if (!product) notFound();

  const formattedProduct = {
    id: product.id,
    image: product.image,
    name: product.name,
    description: product.description || '',
    price: Number(product.price),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
    stock: Number(product.stock),
    isNew: product.isNew === true,
    categoryId: product.categoryId,
    category: product.category || 'Uncategorized',
    additionalImages: Array.isArray(product.additionalImages) ? product.additionalImages : [],
    rating: Number(product.rating) || 0,
    reviews: Number(product.reviews) || 0,
  };

  const session = await getSession();
  const currentUserId = session ? session.userId : null;

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-white to-slate-50/40 pb-10">
        {/* Glass back bar */}
        <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-amber-100/30 shadow-sm">
          <div className="container mx-auto px-4 md:px-8 lg:px-12">
            <div className="h-16 flex items-center justify-between">
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
             
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 md:px-8 lg:px-12 pt-8 md:pt-12">
          <div className="animate-scaleIn">
            <ProductDetailClient
              product={formattedProduct}
              currentUserId={currentUserId}
            />
          </div>
        </main>
      </div>
    </>
  );
}