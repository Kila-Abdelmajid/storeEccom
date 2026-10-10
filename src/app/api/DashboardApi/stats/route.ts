import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [row] = await sql`
    SELECT
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM products) AS total_products,
      (SELECT COUNT(*) FROM orders WHERE status IN ('confirmed', 'delivered')) AS total_orders,
      (SELECT COALESCE(SUM(totalprice), 0) FROM orders WHERE status IN ('confirmed', 'delivered')) AS total_revenue
  `;

  return NextResponse.json({
    totalUsers: Number(row.total_users),
    totalProducts: Number(row.total_products),
    totalOrders: Number(row.total_orders),
    totalRevenue: Number(row.total_revenue),
  });
}