import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.trim().length < 1) {
    return NextResponse.json([]);
  }

  try {
    const products = await sql`
      SELECT 
        p.productid as id,
        p.productname as name,
        p.price,
        p.oldprice as "oldPrice",
        p.productimage as image,
        p.stock,
        COALESCE((SELECT AVG(rating)::float FROM reviews WHERE productid = p.productid), 0) as rating
      FROM products p
      WHERE p.productname ILIKE ${'%' + query + '%'}
      ORDER BY 
        CASE 
          WHEN p.productname ILIKE ${query + '%'} THEN 1
          WHEN p.productname ILIKE ${'%' + query + '%'} THEN 2
          ELSE 3
        END
      LIMIT 10
    `;

    const formatted = products.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
      image: p.image,
      stock: Number(p.stock),
      rating: Number(p.rating),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}