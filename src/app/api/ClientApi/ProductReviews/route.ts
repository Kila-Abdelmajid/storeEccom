import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

// ----------------------------------------------------------------------
// GET /api/reviews?productId=123
// ----------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get('productId');
  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 });
  }

  try {
    const reviews = await sql`
      SELECT 
        r.reviewid as id,
        r.userid as "userId",
        CONCAT(u.firstname, ' ', u.lastname) as "userName",
        r.rating,
        r.comment,
        r.createdat as "createdAt",
        r.createdat as "updatedAt"
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

// ----------------------------------------------------------------------
// POST /api/reviews
// Body: { productId, rating, comment }
// ----------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.userId;

  const body = await request.json();
  const { productId, rating, comment } = body;

  if (!productId || !rating || !comment) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    const [newReview] = await sql`
      INSERT INTO reviews (userid, productid, rating, comment)
      VALUES (${userId}, ${productId}, ${rating}, ${comment})
      RETURNING 
        reviewid as id,
        userid as "userId",
        rating,
        comment,
        createdat as "createdAt",
        createdat as "updatedAt"
    `;
    // Fetch username
    const [user] = await sql`
      SELECT CONCAT(firstname, ' ', lastname) as "userName"
      FROM users WHERE userid = ${userId}
    `;
    return NextResponse.json({
      ...newReview,
      userName: user.userName,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// PUT /api/reviews?reviewId=123
// Body: { rating, comment }
// ----------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.userId;
  const reviewId = request.nextUrl.searchParams.get('reviewId');
  if (!reviewId) {
    return NextResponse.json({ error: 'reviewId required' }, { status: 400 });
  }

  const { rating, comment } = await request.json();

  try {
    // Check ownership
    const [existing] = await sql`
      SELECT userid FROM reviews WHERE reviewid = ${parseInt(reviewId)}
    `;
    if (!existing || existing.userid !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [updated] = await sql`
      UPDATE reviews
      SET rating = ${rating}, comment = ${comment}
      WHERE reviewid = ${parseInt(reviewId)}
      RETURNING 
        reviewid as id,
        userid as "userId",
        rating,
        comment,
        createdat as "createdAt",
        createdat as "updatedAt"
    `;
    const [user] = await sql`
      SELECT CONCAT(firstname, ' ', lastname) as "userName"
      FROM users WHERE userid = ${userId}
    `;
    return NextResponse.json({
      ...updated,
      userName: user.userName,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// DELETE /api/reviews?reviewId=123
// ----------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.userId;
  const reviewId = request.nextUrl.searchParams.get('reviewId');
  if (!reviewId) {
    return NextResponse.json({ error: 'reviewId required' }, { status: 400 });
  }

  try {
    const [existing] = await sql`
      SELECT userid FROM reviews WHERE reviewid = ${parseInt(reviewId)}
    `;
    if (!existing || existing.userid !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`DELETE FROM reviews WHERE reviewid = ${parseInt(reviewId)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}