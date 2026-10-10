import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import sql from '@/lib/db';

async function checkAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session };
}

// ==================== GET /api/DashboardApi/orders ====================
export async function GET(req: NextRequest) {
  const { error } = await checkAdmin();
  if (error) return error;

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (status && status !== 'all') {
    conditions.push(`o.status = $${params.length + 1}`);
    params.push(status);
  }
  if (search) {
    conditions.push(`(o.orderid::text ILIKE $${params.length + 1} OR CONCAT(u.firstname, ' ', u.lastname) ILIKE $${params.length + 1})`);
    params.push(`%${search}%`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) as total
    FROM orders o
    JOIN users u ON o.userid = u.userid
    ${whereClause}
  `;
  const [countResult] = await sql.unsafe(countQuery, params);
  const total = Number(countResult.total);
  const totalPages = Math.ceil(total / limit);

  const dataQuery = `
    SELECT
      o.orderid,
      o.totalprice,
      o.status,
      o.createdat,
      o.shipping_address as "shippingAddress",
      o.shipping_phone as "shippingPhone",
      u.userid,
      u.firstname,
      u.lastname,
      u.email,
      json_agg(
        json_build_object(
          'productId', p.productid,
          'productName', p.productname,
          'quantity', oi.quantity,
          'priceAtPurchase', oi.priceatpurchase,
          'image', p.productimage
        )
      ) as items
    FROM orders o
    JOIN users u ON o.userid = u.userid
    LEFT JOIN orderitems oi ON o.orderid = oi.orderid
    LEFT JOIN products p ON oi.productid = p.productid
    ${whereClause}
    GROUP BY o.orderid, u.userid, u.firstname, u.lastname, u.email,
             o.shipping_address, o.shipping_phone
    ORDER BY o.createdat DESC
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;
  const orders = await sql.unsafe(dataQuery, [...params, limit, offset]);

  const formattedOrders = orders.map((o: any) => ({
    orderId: o.orderid,
    customer: {
      userId: o.userid,
      name: `${o.firstname} ${o.lastname}`,
      email: o.email,
    },
    totalPrice: Number(o.totalprice),
    status: o.status,
    createdAt: o.createdat,
    items: o.items || [],
    shippingAddress: o.shippingAddress,
    shippingPhone: o.shippingPhone,
  }));

  if (limit === 5 && !searchParams.has('page')) {
    return NextResponse.json(formattedOrders);
  }

  return NextResponse.json({
    orders: formattedOrders,
    pagination: { page, limit, total, totalPages },
  });
}

// PUT and DELETE remain the same as before (unchanged)
export async function PUT(req: NextRequest) {
  const { error } = await checkAdmin();
  if (error) return error;

  const { orderId, status } = await req.json();
  if (!orderId || isNaN(parseInt(orderId))) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
  }
  if (!['pending', 'confirmed', 'delivered', 'canceled'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  try {
    await sql`
      UPDATE orders
      SET status = ${status}
      WHERE orderid = ${parseInt(orderId)}
    `;
    return NextResponse.json({ success: true, status });
  } catch {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { error } = await checkAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  if (!orderId || isNaN(parseInt(orderId))) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  try {
    await sql`DELETE FROM orderitems WHERE orderid = ${parseInt(orderId)}`;
    await sql`DELETE FROM orders WHERE orderid = ${parseInt(orderId)}`;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}