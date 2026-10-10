// app/api/ClientApi/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

async function getUserId() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session.userId;
}

// ✅ GET – أضفنا "as id"
export async function GET() {
  try {
    const userId = await getUserId();
    const cart = await sql`
      SELECT 
        ci."cartItemsId" as id,               -- 🔥 المفتاح الأساسي
        ci.quantity,
        p.productid as productId,
        p.productname as name,
        p.price,
        p.oldprice as "oldPrice",
        p.productimage as image,
        p.stock
      FROM cart_items ci
      JOIN products p ON ci.productid = p.productid
      WHERE ci.userid = ${userId}
    `;
    return NextResponse.json(cart);
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// ✅ POST – لا تغيير (يعمل)
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { productId, quantity = 1 } = await req.json();

    const [product] = await sql`SELECT stock FROM products WHERE productid = ${productId}`;
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.stock < quantity) return NextResponse.json({ error: 'Stock insuffisant' }, { status: 400 });


    await sql`
      INSERT INTO cart_items (userid, productid, quantity)
      VALUES (${userId}, ${productId}, ${quantity})
      ON CONFLICT (userid, productid)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity,
                    updatedat = CURRENT_TIMESTAMP
    `;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// ✅ PUT – استخدم "cartItemsId" بشكل صحيح
export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { cartItemId, quantity } = await req.json();
    if (!cartItemId || quantity < 1) throw new Error();

    // تحقق من انتماء العنصر للمستخدم
    const [item] = await sql`
      SELECT productid FROM cart_items 
      WHERE "cartItemsId" = ${cartItemId} AND userid = ${userId}
    `;
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const [product] = await sql`SELECT stock FROM products WHERE productid = ${item.productid}`;
    if (product.stock < quantity) return NextResponse.json({ error: 'Stock insuffisant' }, { status: 400 });

    await sql`
      UPDATE cart_items
      SET quantity = ${quantity}, updatedat = CURRENT_TIMESTAMP
      WHERE "cartItemsId" = ${cartItemId} AND userid = ${userId}
    `;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized or invalid data' }, { status: 400 });
  }
}

// ✅ DELETE – نفس الشيء
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(req.url);
    const cartItemId = searchParams.get('cartItemId');
    if (!cartItemId) throw new Error();

    await sql`
      DELETE FROM cart_items 
      WHERE "cartItemsId" = ${parseInt(cartItemId)} AND userid = ${userId}
    `;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}