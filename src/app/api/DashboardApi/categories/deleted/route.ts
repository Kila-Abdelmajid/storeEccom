import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const categories = await sql`
      SELECT categoryid as id, categoryname as name, slug, categoryimage as image,
             deleted_at as "deletedAt"
      FROM categories
      WHERE is_deleted = true
      ORDER BY deleted_at DESC
    `;
    return NextResponse.json(categories);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch deleted categories' }, { status: 500 });
  }
}