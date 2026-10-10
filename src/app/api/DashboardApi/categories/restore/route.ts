import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Check if category exists and is deleted
    const category = await sql`
      SELECT categoryid FROM categories WHERE categoryid = ${parseInt(id)} AND is_deleted = true
    `;
    if (category.length === 0) {
      return NextResponse.json({ error: 'Category not found or already active' }, { status: 404 });
    }

    // Restore category
    await sql`
      UPDATE categories SET is_deleted = false, deleted_at = NULL
      WHERE categoryid = ${parseInt(id)}
    `;

    // Restore only products that were archived due to this category (archived_by_category = true)
    await sql`
      UPDATE products
      SET is_deleted = false, deleted_at = NULL, archived_by_category = false
      WHERE categoryid = ${parseInt(id)} AND archived_by_category = true AND is_deleted = true
    `;

    return NextResponse.json({ success: true, message: 'Category and its products restored' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Restore failed' }, { status: 500 });
  }
}