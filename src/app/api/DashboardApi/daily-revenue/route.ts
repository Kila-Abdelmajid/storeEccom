import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const revenue = await sql`
    SELECT
      TO_CHAR(createdat, 'YYYY-MM-DD') AS day,
      COALESCE(SUM(totalprice), 0) AS revenue
    FROM orders
    WHERE status IN ('confirmed', 'delivered')
      AND createdat >= NOW() - INTERVAL '30 days'
    GROUP BY TO_CHAR(createdat, 'YYYY-MM-DD')
    ORDER BY day ASC
  `;

  return NextResponse.json(
    revenue.map((r: any) => ({
      day: r.day,
      revenue: Number(r.revenue),
    }))
  );
}