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
        p.deleted_at as "deletedAt",
        p.archived_by_category as "archivedByCategory",
        COALESCE(
          (SELECT json_agg(imagepath) FROM productimages WHERE productid = p.productid),
          '[]'::json
        ) as "additionalImages"
      FROM products p
      LEFT JOIN categories c ON p.categoryid = c.categoryid
      WHERE p.is_deleted = true
      ORDER BY p.deleted_at DESC
    `;

    const formatted = products.map((p: any) => ({
      ...p,
      additionalImages: Array.isArray(p.additionalImages) ? p.additionalImages : [],
      price: Number(p.price),
      oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
      stock: Number(p.stock),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch deleted products' }, { status: 500 });
  }
}