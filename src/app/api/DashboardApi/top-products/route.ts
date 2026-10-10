import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '5');
  const products = await sql`
    SELECT
      p.productid,
      p.productname,
      p.price,
      p.productimage,
      COALESCE(SUM(oi.quantity), 0) AS total_sold
    FROM products p
    LEFT JOIN orderitems oi ON p.productid = oi.productid
    GROUP BY p.productid
    ORDER BY total_sold DESC
    LIMIT ${limit}
  `;

  return NextResponse.json(
    products.map((p: any) => ({
      productId: p.productid,
      productName: p.productname,
      price: Number(p.price),
      productImage: p.productimage,
      totalSold: Number(p.total_sold),
    }))
  );
}