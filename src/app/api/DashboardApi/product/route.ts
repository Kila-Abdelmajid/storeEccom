import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/auth';





// --- POST: إضافة منتج جديد ---
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

     const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized – no session" }, { status: 401 });
      }
      const userId = session.userId;

    // 1. الحقول النصية
    const name = formData.get('name') as string;
    const description = (formData.get('description') as string) || '';
    const categoryId = parseInt(formData.get('categoryId') as string);
    const price = parseFloat(formData.get('price') as string);
    const oldPrice = formData.get('oldPrice') ? parseFloat(formData.get('oldPrice') as string) : null;
    const stock = parseInt(formData.get('stock') as string);

    // التحقق السريع
    if (!name || !categoryId || !price || !stock) {
      return NextResponse.json({ error: 'all fields are required' }, { status: 400 });
    }

    // 2. الصورة الرئيسية (إجبارية)
    const mainImage = formData.get('mainImage') as File;
    if (!mainImage) {
      return NextResponse.json({ error: ' the main image is required' }, { status: 400 });
    }

    // حفظ الملف
    const uploadDir = path.join(process.cwd(), 'public/uploads/products');
    await mkdir(uploadDir, { recursive: true });
    const uniqueName = `${Date.now()}-${mainImage.name.replace(/\s/g, '')}`;
    const buffer = Buffer.from(await mainImage.arrayBuffer());
    await writeFile(path.join(uploadDir, uniqueName), buffer);
    const mainImageUrl = `/uploads/products/${uniqueName}`;

    // 3. إدراج المنتج
    const result = await sql`
      INSERT INTO products (productname, description, price, "oldprice", stock, categoryid, productimage, isnew, userid)
      VALUES (${name}, ${description}, ${price}, ${oldPrice}, ${stock}, ${categoryId}, ${mainImageUrl}, true, ${userId})
      
      RETURNING productid
    `;
    const productId = result[0].productid;

    // 4. الصور الإضافية
    const additionalFiles = formData.getAll('additionalImages') as File[];
    for (const file of additionalFiles) {
      if (file.size > 0) {
        const uniqueAdd = `${Date.now()}-${file.name.replace(/\s/g, '')}`;
        const addBuffer = Buffer.from(await file.arrayBuffer());
        await writeFile(path.join(uploadDir, uniqueAdd), addBuffer);
        const addUrl = `/uploads/products/${uniqueAdd}`;
        await sql`
          INSERT INTO productimages (productid, imagepath)
          VALUES (${productId}, ${addUrl})
        `;
      }
    }

    return NextResponse.json({ success: true, message: 'insertion successful', productId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'insertion failed' }, { status: 500 });
  }
}

// --- PUT: تحديث منتج ---
export async function PUT(request: Request) {
  try {


     const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized , no session" }, { status: 401 });
  }
  const userId = session.userId;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const formData = await request.formData();

    // الحقول النصية
    const name = formData.get('name') as string;
    const description = (formData.get('description') as string) || '';
    const categoryId = parseInt(formData.get('categoryId') as string);
    const price = parseFloat(formData.get('price') as string);
    const oldPrice = formData.get('oldPrice') ? parseFloat(formData.get('oldPrice') as string) : null;
    const stock = parseInt(formData.get('stock') as string);

    if (!name || !categoryId || !price || !stock) {
      return NextResponse.json({ error:'all fields are required' }, { status: 400 });
    }

    // 1. تحديث المعلومات الأساسية في جدول products
    await sql`
      UPDATE products
      SET 
        productname = ${name},
        description = ${description},
        price = ${price},
        "oldprice" = ${oldPrice},
        stock = ${stock},
        categoryid = ${categoryId}
      WHERE productid = ${parseInt(id)} 
    `;

    // 2. معالجة الصورة الرئيسية الجديدة (إذا رفع المستخدم ملف)
    const newMainImage = formData.get('mainImage') as File | null;
    if (newMainImage && newMainImage.size > 0) {
      const uploadDir = path.join(process.cwd(), 'public/uploads/products');
      await mkdir(uploadDir, { recursive: true });
      const uniqueName = `${Date.now()}-${newMainImage.name.replace(/\s/g, '')}`;
      const buffer = Buffer.from(await newMainImage.arrayBuffer());
      await writeFile(path.join(uploadDir, uniqueName), buffer);
      const imageUrl = `/uploads/products/${uniqueName}`;

      await sql`
        UPDATE products
        SET productimage = ${imageUrl}
        WHERE productid = ${parseInt(id)} 
      `;
    }

    // 3. إضافة الصور الإضافية الجديدة (دون حذف القديمة)
    const additionalFiles = formData.getAll('additionalImages') as File[];
    const uploadDir = path.join(process.cwd(), 'public/uploads/products');
    for (const file of additionalFiles) {
      if (file && file.size > 0) {
        const uniqueAdd = `${Date.now()}-${file.name.replace(/\s/g, '')}`;
        const addBuffer = Buffer.from(await file.arrayBuffer());
        await writeFile(path.join(uploadDir, uniqueAdd), addBuffer);
        const addUrl = `/uploads/products/${uniqueAdd}`;
        await sql`
          INSERT INTO productimages (productid, imagepath)
          VALUES (${parseInt(id)}, ${addUrl})
        `;
      }
    }

    return NextResponse.json({ success: true, message: 'update successful' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'update failed' }, { status: 500 });
  }
}

// Add this inside your existing route.ts (after imports)

// GET active products (is_deleted = false)
export async function GET() {
  try {
    const products = await sql`
      SELECT 
        p.productid as id,
        p.productimage as image,
        p.productname as name,
        p.description,
        p.price,
        p.oldprice as "oldPrice",
        p.stock,
        p.isnew as "isNew",
        p.categoryid as "categoryId",
        c.categoryname as category,
        c.is_deleted as "categoryDeleted",
        COALESCE(
          (SELECT json_agg(imagepath) FROM productimages WHERE productid = p.productid),
          '[]'::json
        ) as "additionalImages"
      FROM products p
      LEFT JOIN categories c ON p.categoryid = c.categoryid
      WHERE p.is_deleted = false
      ORDER BY p.createdat DESC
    `;

    const formatted = products.map((p: any) => ({
      ...p,
      additionalImages: Array.isArray(p.additionalImages) ? p.additionalImages : [],
      price: Number(p.price),
      oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
      stock: Number(p.stock),
      categoryDeleted: p.categoryDeleted || false,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// DELETE (soft delete) – manual archive (archived_by_category = false)
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    await sql`
      UPDATE products
      SET is_deleted = true, deleted_at = NOW(), archived_by_category = false
      WHERE productid = ${parseInt(id)} AND is_deleted = false
    `;

    return NextResponse.json({ success: true, message: 'Product archived' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Archive failed' }, { status: 500 });
  }
}