import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import sql from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.userId;
  const { items } = await req.json();

  if (!items || !Array.isArray(items)) {
    return NextResponse.json({ error: 'Invalid items' }, { status: 400 });
  }

  // Insert/update each item
  for (const item of items) {
    const { productId, quantity } = item;
    await sql`
      INSERT INTO cart_items (userid, productid, quantity)
      VALUES (${userId}, ${productId}, ${quantity})
      ON CONFLICT (userid, productid)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity,
                    updatedat = CURRENT_TIMESTAMP
    `;
  }

  return NextResponse.json({ success: true });
}