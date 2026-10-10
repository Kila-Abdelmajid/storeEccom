import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/auth';

// GET active categories (not deleted)
export async function GET() {
  try {
    const categories = await sql`
      SELECT categoryid as id, categoryname as name, slug, categoryimage as image,
             userid as "userId"
      FROM categories
      WHERE is_deleted = false
      ORDER BY categoryname ASC
    `;
    return NextResponse.json(categories);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// POST create category
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.userId;

    const formData = await request.formData();
    const name = formData.get('name') as string;
    let slug = formData.get('slug') as string;
    const imageFile = formData.get('image') as File | null;

    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    if (!slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    // Check unique slug among active categories
    const existing = await sql`SELECT slug FROM categories WHERE slug = ${slug} AND is_deleted = false`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    let imagePath: string | null = null;
    if (imageFile && imageFile.size > 0) {
      const uploadDir = path.join(process.cwd(), 'public/uploads/categories');
      await mkdir(uploadDir, { recursive: true });
      const ext = path.extname(imageFile.name);
      const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}${ext}`;
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);
      imagePath = `/uploads/categories/${filename}`;
    }

    const result = await sql`
      INSERT INTO categories (categoryname, slug, categoryimage, userid)
      VALUES (${name}, ${slug}, ${imagePath}, ${userId})
      RETURNING categoryid as id
    `;
    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Creation failed' }, { status: 500 });
  }
}

// PUT update category (only active)
export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.userId;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const imageFile = formData.get('image') as File | null;

    if (!name || !slug) return NextResponse.json({ error: 'Name and slug required' }, { status: 400 });

    // Check slug uniqueness excluding current and among active categories
    const existing = await sql`
      SELECT categoryid FROM categories
      WHERE slug = ${slug} AND categoryid != ${parseInt(id)} AND is_deleted = false
    `;
    if (existing.length > 0) return NextResponse.json({ error: 'Slug already used' }, { status: 400 });

    let imagePath: string | null | undefined = undefined;
    if (imageFile && imageFile.size > 0) {
      const uploadDir = path.join(process.cwd(), 'public/uploads/categories');
      await mkdir(uploadDir, { recursive: true });
      const ext = path.extname(imageFile.name);
      const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}${ext}`;
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);
      imagePath = `/uploads/categories/${filename}`;

      // Delete old image file
      const old = await sql`SELECT categoryimage FROM categories WHERE categoryid = ${parseInt(id)}`;
      if (old[0]?.categoryimage) {
        const oldPath = path.join(process.cwd(), 'public', old[0].categoryimage);
        try { await unlink(oldPath); } catch { /* ignore */ }
      }
    }

    if (imagePath !== undefined) {
      await sql`
        UPDATE categories
        SET categoryname = ${name}, slug = ${slug}, categoryimage = ${imagePath}
        WHERE categoryid = ${parseInt(id)} AND userid = ${userId} AND is_deleted = false
      `;
    } else {
      await sql`
        UPDATE categories
        SET categoryname = ${name}, slug = ${slug}
        WHERE categoryid = ${parseInt(id)} AND userid = ${userId} AND is_deleted = false
      `;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// DELETE (soft delete) – archive category and all its products (set archived_by_category = true)
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.userId;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Check if category exists and is active
    const category = await sql`
      SELECT categoryid FROM categories WHERE categoryid = ${parseInt(id)} AND is_deleted = false
    `;
    if (category.length === 0) {
      return NextResponse.json({ error: 'Category not found or already deleted' }, { status: 404 });
    }

    // Soft delete category
    await sql`
      UPDATE categories SET is_deleted = true, deleted_at = NOW()
      WHERE categoryid = ${parseInt(id)} AND userid = ${userId}
    `;

    // Soft delete all active products in this category, mark them as archived_by_category = true
    await sql`
      UPDATE products
      SET is_deleted = true, deleted_at = NOW(), archived_by_category = true
      WHERE categoryid = ${parseInt(id)} AND is_deleted = false
    `;

    return NextResponse.json({ success: true, message: 'Category and its products archived' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Archive failed' }, { status: 500 });
  }
}