import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/favorites → récupérer les produits favoris de l’utilisateur
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.userId;

  const favorites = await sql`
    SELECT 
      p.productid as id,
      p.productname as name,
      p.price,
      p.oldprice as "oldPrice",
      p.productimage as image,
      p.stock,
      COALESCE((SELECT AVG(rating)::float FROM reviews WHERE productid = p.productid), 0) as rating,
      COALESCE((SELECT COUNT(*) FROM reviews WHERE productid = p.productid), 0) as reviews
    FROM favorites f
    JOIN products p ON f.productid = p.productid
    WHERE f.userid = ${userId}
    ORDER BY f.createdat DESC
  `;
  return NextResponse.json(favorites);
}

// POST /api/favorites – ajouter un favori (body: { productId })
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.userId;
  const { productId } = await req.json();

  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

  try {
    await sql`
      INSERT INTO favorites (userid, productid)
      VALUES (${userId}, ${productId})
      ON CONFLICT (userid, productid) DO NOTHING
    `;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

// DELETE /api/favorites?productId=123
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.userId;
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

  await sql`DELETE FROM favorites WHERE userid = ${userId} AND productid = ${parseInt(productId)}`;
  return NextResponse.json({ success: true });
}