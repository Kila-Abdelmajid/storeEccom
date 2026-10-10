import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const months = 6;
  const revenue = await sql`
    SELECT
      TO_CHAR(DATE_TRUNC('month', createdat), 'Mon YYYY') AS month,
      COALESCE(SUM(totalprice), 0) AS revenue
    FROM orders
    WHERE status IN ('confirmed', 'delivered')
      AND createdat >= NOW() - (${months} || ' months')::INTERVAL
    GROUP BY DATE_TRUNC('month', createdat)
    ORDER BY DATE_TRUNC('month', createdat) ASC
  `;

  return NextResponse.json(
    revenue.map((r: any) => ({
      month: r.month,
      revenue: Number(r.revenue),
    }))
  );
}