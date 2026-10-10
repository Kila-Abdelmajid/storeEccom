import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import sql from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.userId;

  const { shippingAddress, shippingPhone } = await req.json();

  // 1. Get cart items
  const cart = await sql`
    SELECT ci.productid, ci.quantity, p.price, p.stock
    FROM cart_items ci
    JOIN products p ON ci.productid = p.productid
    WHERE ci.userid = ${userId}
  `;

  if (cart.length === 0) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });

  // 2. Validate stock
  for (const item of cart) {
    if (item.quantity > item.stock) {
      return NextResponse.json(
        { error: `Product ${item.productid} only has ${item.stock} in stock` },
        { status: 400 }
      );
    }
  }

  // 3. Calculate total
  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  // 4. Create order with shipping info
  const [order] = await sql`
    INSERT INTO orders (userid, totalprice, status, shipping_address, shipping_phone)
    VALUES (${userId}, ${total}, 'pending', ${shippingAddress || null}, ${shippingPhone || null})
    RETURNING orderid
  `;

  // 5. Insert order items and update stock
  for (const item of cart) {
    await sql`
      INSERT INTO orderitems (orderid, productid, quantity, priceatpurchase)
      VALUES (${order.orderid}, ${item.productid}, ${item.quantity}, ${item.price})
    `;
    await sql`
      UPDATE products SET stock = stock - ${item.quantity}
      WHERE productid = ${item.productid}
    `;
  }

  // 6. Clear cart
  await sql`DELETE FROM cart_items WHERE userid = ${userId}`;

  return NextResponse.json({ orderId: order.orderid });
}