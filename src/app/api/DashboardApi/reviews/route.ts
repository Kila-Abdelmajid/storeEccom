import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }

    const reviews = await sql`
      SELECT 
        r.reviewid as id,
        r.rating,
        r.comment,
        r.createdat as "createdAt",
        u.firstname || ' ' || u.lastname as "userName",   -- lowercase!
        u.email as "userEmail"
      FROM reviews r
      JOIN users u ON r.userid = u.userid
      WHERE r.productid = ${parseInt(productId)}
      ORDER BY r.createdat DESC
    `;
    return NextResponse.json(reviews);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
    }
    await sql`DELETE FROM reviews WHERE reviewid = ${parseInt(id)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}