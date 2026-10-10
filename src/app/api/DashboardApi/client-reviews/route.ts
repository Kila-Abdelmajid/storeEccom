import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import sql from '@/lib/db';

async function isAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return false;
  return session;
}

// GET all client reviews (admin only)
export async function GET() {
  const session = await isAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const reviews = await sql`
      SELECT 
        r.id,
        r.userId AS "userId",
        COALESCE(u.firstname || ' ' || u.lastname, r.name) AS "userName",
        u.email AS "userEmail",
        r.rating,
        r.content,
        r.verified,
        r.createdAt AS "createdAt"
      FROM clientReviews r
      LEFT JOIN users u ON r.userId = u.userid
      ORDER BY r.createdAt DESC
    `;
    const formatted = reviews.map((r: any) => ({
      ...r,
      userEmail: r.userEmail || '',
    }));
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('GET client-reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// PUT update a review (admin only) – only verified field is used by the frontend
export async function PUT(request: Request) {
  const session = await isAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing review id' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { rating, content, verified } = body;

    // Validate inputs (only the fields that are provided)
    if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }
    if (content !== undefined && typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }
    if (verified !== undefined && typeof verified !== 'boolean') {
      return NextResponse.json({ error: 'Invalid verified flag' }, { status: 400 });
    }

    // Build dynamic UPDATE
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (rating !== undefined) {
      updates.push(`rating = $${idx++}`);
      values.push(rating);
    }
    if (content !== undefined) {
      updates.push(`content = $${idx++}`);
      values.push(content);
    }
    if (verified !== undefined) {
      updates.push(`verified = $${idx++}`);
      values.push(verified);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(parseInt(id));
    const query = `
      UPDATE clientReviews
      SET ${updates.join(', ')}
      WHERE id = $${idx}
      RETURNING id, rating, content, verified
    `;

    const [updated] = await sql.unsafe(query, values);
    if (!updated) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    console.error('PUT client-reviews error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// DELETE a review (admin only)
export async function DELETE(request: Request) {
  const session = await isAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing review id' }, { status: 400 });
  }

  try {
    const result = await sql`
      DELETE FROM clientReviews
      WHERE id = ${parseInt(id)}
      RETURNING id
    `;
    if (result.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE client-reviews error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}