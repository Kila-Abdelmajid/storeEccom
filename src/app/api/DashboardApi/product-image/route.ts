// app/api/product-image/route.ts
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const imageUrl = searchParams.get('imageUrl');

    if (!productId || !imageUrl) {
      return NextResponse.json({ error: 'Missing productId or imageUrl' }, { status: 400 });
    }

    // 1. Delete the record from database
    const result = await sql`
      DELETE FROM productimages 
      WHERE productid = ${parseInt(productId)} AND imagepath = ${imageUrl}
      RETURNING imagepath
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // 2. Delete the physical file from server
    const fullPath = path.join(process.cwd(), 'public', imageUrl);
    try {
      await unlink(fullPath);
    } catch (fileErr) {
      console.warn('Could not delete file:', fileErr);
      // Don't fail the request if file already gone
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}