import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.userId;

  try {
    const orders = await sql`
      SELECT 
        o.orderid as id,
        o.totalprice as total,
        o.status,
        o.createdat as "createdAt",
        COALESCE(
          json_agg(
            json_build_object(
              'productId', p.productid,
              'name', p.productname,
              'image', p.productimage,
              'quantity', oi.quantity,
              'priceAtPurchase', oi.priceatpurchase
            )
          ) FILTER (WHERE p.productid IS NOT NULL),
          '[]'
        ) as items
      FROM orders o
      LEFT JOIN orderitems oi ON o.orderid = oi.orderid
      LEFT JOIN products p ON oi.productid = p.productid
      WHERE o.userid = ${userId}
      GROUP BY o.orderid
      ORDER BY o.createdat DESC
    `;
    return NextResponse.json(orders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}