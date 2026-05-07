import { notFound } from 'next/navigation';
import Image from 'next/image';
import {
  ShoppingCartIcon,
  ShieldCheckIcon,
  TruckIcon,
  ArrowLeftIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { RatingStars } from '@/components/ui/RatingStars';
import { formatPrice } from '@/utils/format';
import { AppButton } from '@/components/ui/AppButton';
import Link from 'next/link';
import sql from '@/lib/db';
import ProductGallery from '@/components/client/ProductGallery/ProductGallery';
import ProductReviewsSection from '@/components/client/ProductReviewsSection/ProductReviewsSection';
import { getSession } from '@/lib/auth'; // use your own auth method

type Params = Promise<{ id: string }>;

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const productId = parseInt(id);

  // Fetch product directly with SQL
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

  const session = await getSession(); // adjust to your auth method
  const currentUserId = session ? session.userId : null;

  const inStock = formattedProduct.stock > 0;

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
        .thumbnail-hover {
          transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        }
        .thumbnail-hover:hover {
          transform: scale(1.05);
          border-color: #c9a96e;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <div className="min-h-screen bg-white pb-20">
        {/* Sub‑navigation (Back to Shop) */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-50">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Link href="/products" className="flex items-center text-sm font-medium text-gray-500 hover:text-black transition-colors">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Shop
            </Link>
          </div>
        </div>

        {/* Increased top padding because header is fixed (adjust pt-28 or pt-32) */}
        <main className="container mx-auto px-4 pt-28 md:pt-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Gallery */}
            <ProductGallery
              mainImage={formattedProduct.image}
              name={formattedProduct.name}
              additionalImages={formattedProduct.additionalImages}
              isNew={formattedProduct.isNew}
            />

            {/* Product info */}
            <div className="flex flex-col space-y-8">
              {/* ... (your existing product info section) ... */}
              <div className="space-y-4">
                <p className="text-[#c9a96e] text-sm font-bold uppercase tracking-[0.2em]">
                  {formattedProduct.category}
                </p>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  {formattedProduct.name}
                </h1>
                <div className="flex items-center gap-4">
                  <RatingStars rating={formattedProduct.rating} reviews={formattedProduct.reviews} />
                  <span className="h-4 w-[1px] bg-gray-200" />
                  <span className={`text-sm font-semibold ${inStock ? 'text-green-600' : 'text-red-600'}`}>
                    {inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(formattedProduct.price)}
                  </span>
                  {formattedProduct.oldPrice && (
                    <span className="text-xl text-gray-400 line-through font-medium">
                      {formatPrice(formattedProduct.oldPrice)}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 leading-relaxed text-lg">
                  {formattedProduct.description || 'No description available'}
                </p>
              </div>

              <div className="h-[1px] w-full bg-gray-100" />

              <div className="flex flex-col sm:flex-row gap-4">
                <AppButton
                  variant="primary"
                  className="flex-[3] h-14 bg-black hover:bg-gray-800 text-white rounded-2xl text-base font-bold shadow-xl active:scale-[0.98] transition-all"
                  disabled={!inStock}
                >
                  <ShoppingCartIcon className="w-5 h-5 mr-3" />
                  {inStock ? 'Add to Cart' : 'Out of Stock'}
                </AppButton>
                <button className="flex-1 h-14 border-2 border-gray-100 hover:border-rose-500 hover:bg-rose-50 rounded-2xl flex items-center justify-center group transition-all">
                  <HeartIcon className="w-6 h-6 text-gray-400 group-hover:text-rose-500 transition-colors" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                <div className="flex items-center p-4 bg-gray-50 rounded-2xl">
                  <TruckIcon className="w-6 h-6 text-[#c9a96e] mr-3" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Free Delivery</h4>
                    <p className="text-[11px] text-gray-500">Orders over 1000 DH</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-gray-50 rounded-2xl">
                  <ShieldCheckIcon className="w-6 h-6 text-[#c9a96e] mr-3" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">2 Year Warranty</h4>
                    <p className="text-[11px] text-gray-500">Official brand cover</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ★ Reviews Section ★ */}
          <ProductReviewsSection productId={formattedProduct.id} currentUserId={currentUserId} />
        </main>
      </div>
    </>
  );
}