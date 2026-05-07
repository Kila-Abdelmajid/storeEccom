// app/api/ClientApi/products/route.ts
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const products = await sql`
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
          (SELECT AVG(rating)::float FROM reviews WHERE productid = p.productid),
          0
        ) as rating,
        COALESCE(
          (SELECT COUNT(*) FROM reviews WHERE productid = p.productid),
          0
        ) as reviews
      FROM products p
      LEFT JOIN categories c ON p.categoryid = c.categoryid
      ORDER BY p.createdat DESC
    `;

    const formatted = products.map((p: any) => ({
      ...p,
      additionalImages: Array.isArray(p.additionalImages) ? p.additionalImages : [],
      price: Number(p.price),
      oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
      stock: Number(p.stock),
      rating: Number(p.rating) || 0,
      reviews: Number(p.reviews) || 0,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}