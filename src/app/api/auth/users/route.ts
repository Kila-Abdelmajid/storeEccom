import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';

// Helper to check if current session is admin
async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  const [user] = await sql<{ role: string }[]>`SELECT role FROM users WHERE userid = ${session.userId}`;
  return user?.role === 'admin';
}

// ==================== POST ====================
// Create user WITHOUT session – must verify OTP first
export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password } = await req.json();

    const [existing] = await sql`SELECT email FROM users WHERE email = ${email}`;
    if (existing) return NextResponse.json({ error: "Email already used" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 12);
    await sql`
      INSERT INTO users (firstname, lastname, email, password, is_verified)
      VALUES (${firstName}, ${lastName}, ${email}, ${hashedPassword}, false)
    `;
    // No session created – user must verify email via OTP
    return NextResponse.json({ success: true, message: "User created, please verify email" }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error during creation" }, { status: 500 });
  }
}

// ==================== GET ====================
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdminUser = await isAdmin();

  try {
    if (isAdminUser) {
      const users = await sql`
        SELECT 
          userid as id,
          firstname as "firstName",
          lastname as "lastName",
          email,
          role,
          createdat as "createdAt"
        FROM users
        ORDER BY createdat DESC
      `;
      return NextResponse.json(users);
    } else {
      const [user] = await sql`
        SELECT userid, firstname, lastname, email, role, createdat
        FROM users WHERE userid = ${session.userId}
      `;
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      return NextResponse.json({
        id: user.userid,
        firstName: user.firstname,
        lastName: user.lastname,
        email: user.email,
        role: user.role,
        createdAt: user.createdat
      });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// ==================== PUT ====================
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId');
  const newRole = searchParams.get('role');

  if (targetUserId && newRole && (newRole === 'admin' || newRole === 'user')) {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    if (newRole === 'user') {
      const adminCount = await sql`SELECT COUNT(*) FROM users WHERE role = 'admin'`;
      if (adminCount[0].count === 1) {
        const target = await sql`SELECT role FROM users WHERE userid = ${parseInt(targetUserId)}`;
        if (target[0]?.role === 'admin') {
          return NextResponse.json({ error: "Cannot demote the only administrator" }, { status: 400 });
        }
      }
    }

    await sql`UPDATE users SET role = ${newRole} WHERE userid = ${parseInt(targetUserId)}`;
    return NextResponse.json({ success: true });
  }

  const body = await req.json();
  const { firstName, lastName } = body;
  if (!firstName && !lastName ) {
    return NextResponse.json({ error: "No data to update" }, { status: 400 });
  }

  const [updated] = await sql`
    UPDATE users 
    SET firstname = COALESCE(${firstName}, firstname),
        lastname  = COALESCE(${lastName}, lastname)
    WHERE userid = ${session.userId}
    RETURNING userid, firstname, lastname, email
  `;
  return NextResponse.json({
    id: updated.userid,
    firstName: updated.firstname,
    lastName: updated.lastname,
    email: updated.email
  });
}

// ==================== DELETE ====================
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId');
  const isAdminUser = await isAdmin();

  let userIdToDelete: number;

  if (targetUserId && isAdminUser) {
    userIdToDelete = parseInt(targetUserId);
    if (userIdToDelete === session.userId) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }
    const adminCount = await sql`SELECT COUNT(*) FROM users WHERE role = 'admin'`;
    if (adminCount[0].count === 1) {
      const target = await sql`SELECT role FROM users WHERE userid = ${userIdToDelete}`;
      if (target[0]?.role === 'admin') {
        return NextResponse.json({ error: "Cannot delete the only administrator" }, { status: 400 });
      }
    }
  } else if (!targetUserId && !isAdminUser) {
    userIdToDelete = session.userId;
  } else {
    return NextResponse.json({ error: "Action not allowed" }, { status: 403 });
  }

  try {
    await sql`DELETE FROM users WHERE userid = ${userIdToDelete}`;
    const response = NextResponse.json({ message: "User deleted successfully" });
    if (!targetUserId || userIdToDelete === session.userId) {
      (await cookies()).set('session', '', { expires: new Date(0) });
    }
    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}