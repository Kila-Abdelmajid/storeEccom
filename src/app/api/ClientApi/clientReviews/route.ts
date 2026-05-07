import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/ClientApi/clientReviews – public
export async function GET() {
  try {
    const reviews = await sql`
      SELECT 
        cr.id,
        cr.userid as "userId",
        COALESCE(CONCAT(u.firstname, ' ', u.lastname), 'Anonymous') as "userName",
        cr.rating,
        cr.title,
        cr.content,
        cr.verified,
        cr.createdat as "createdAt"
      FROM clientReviews cr
      LEFT JOIN users u ON cr.userid = u.userid
      ORDER BY cr.createdat DESC
    `;
    return NextResponse.json(reviews);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/ClientApi/clientReviews – requires login
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized – please log in' }, { status: 401 });
  }
  const userId = session.userId;

  const body = await request.json();
  const { rating, title, content } = body;

  if (!rating || !title || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Get user's full name from database (we don't ask for it in form)
    const [user] = await sql`
      SELECT CONCAT(firstname, ' ', lastname) as fullname FROM users WHERE userid = ${userId}
    `;
    const displayName = user?.fullname || 'Anonymous';

    const [newReview] = await sql`
      INSERT INTO clientReviews (userid, name, rating, title, content, verified)
      VALUES (${userId}, ${displayName}, ${rating}, ${title}, ${content}, false)
      RETURNING 
        id,
        userid as "userId",
        ${displayName} as "userName",
        rating,
        title,
        content,
        verified,
        createdat as "createdAt"
    `;
    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}

// PUT /api/ClientApi/clientReviews?reviewId=123 – requires ownership
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

  const { rating, title, content } = await request.json();

  try {
    // Check ownership
    const [existing] = await sql`
      SELECT userid FROM clientReviews WHERE id = ${parseInt(reviewId)}
    `;
    if (!existing || existing.userid !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [updated] = await sql`
      UPDATE clientReviews
      SET rating = ${rating}, title = ${title}, content = ${content}
      WHERE id = ${parseInt(reviewId)}
      RETURNING 
        id,
        userid as "userId",
        (SELECT CONCAT(firstname, ' ', lastname) FROM users WHERE userid = ${userId}) as "userName",
        rating,
        title,
        content,
        verified,
        createdat as "createdAt"
    `;
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// DELETE /api/ClientApi/clientReviews?reviewId=123 – requires ownership
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
      SELECT userid FROM clientReviews WHERE id = ${parseInt(reviewId)}
    `;
    if (!existing || existing.userid !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`DELETE FROM clientReviews WHERE id = ${parseInt(reviewId)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}