import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getSession, encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

// Helper to check if current session is admin
async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const [user] = await sql<{ role: string }[]>`SELECT role FROM users WHERE userid = ${session.userId}`;
  return user?.role === 'admin';
}

// ==================== POST ====================
export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password, phone } = await req.json();

    const [existing] = await sql`SELECT email FROM users WHERE email = ${email}`;
    if (existing) return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 12);
    const [user] = await sql`
      INSERT INTO users (firstname, lastname, email, password, phone)
      VALUES (${firstName}, ${lastName}, ${email}, ${hashedPassword}, ${phone})
      RETURNING userid, email, role
    `;
    
    // Create session token
    const sessionToken = await encrypt({ userId: user.userid, role: user.role });
    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ userId: user.userid, email: user.email, role: user.role }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}

// ==================== GET ====================
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const isAdminUser = await isAdmin();

  try {
    if (isAdminUser) {
      // Admin: fetch all users
      const users = await sql`
        SELECT 
          userid as id,
          firstname as "firstName",
          lastname as "lastName",
          email,
          phone,
          role,
          createdat as "createdAt"
        FROM users
        ORDER BY createdat DESC
      `;
      return NextResponse.json(users);
    } else {
      // Regular user: fetch own profile
      const [user] = await sql`
        SELECT userid, firstname, lastname, email, phone, role, createdat
        FROM users WHERE userid = ${session.userId}
      `;
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      return NextResponse.json({
        id: user.userid,
        firstName: user.firstname,
        lastName: user.lastname,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdat
      });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur de récupération" }, { status: 500 });
  }
}

// ==================== PUT ====================
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId');
  const newRole = searchParams.get('role');

  // --- Admin role change ---
  if (targetUserId && newRole && (newRole === 'admin' || newRole === 'user')) {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    if (newRole === 'user') {
      const adminCount = await sql`SELECT COUNT(*) FROM users WHERE role = 'admin'`;
      if (adminCount[0].count === 1) {
        const target = await sql`SELECT role FROM users WHERE userid = ${parseInt(targetUserId)}`;
        if (target[0]?.role === 'admin') {
          return NextResponse.json({ error: "Impossible de rétrograder le seul administrateur" }, { status: 400 });
        }
      }
    }

    await sql`UPDATE users SET role = ${newRole} WHERE userid = ${parseInt(targetUserId)}`;
    return NextResponse.json({ success: true });
  }

  // --- Own profile update ---
  const body = await req.json();
  const { firstName, lastName, phone } = body;
  if (!firstName && !lastName && !phone) {
    return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 });
  }

  const [updated] = await sql`
    UPDATE users 
    SET firstname = COALESCE(${firstName}, firstname),
        lastname  = COALESCE(${lastName}, lastname),
        phone     = COALESCE(${phone}, phone)
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
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId');
  const isAdminUser = await isAdmin();

  let userIdToDelete: number;

  if (targetUserId && isAdminUser) {
    userIdToDelete = parseInt(targetUserId);
    if (userIdToDelete === session.userId) {
      return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });
    }
    const adminCount = await sql`SELECT COUNT(*) FROM users WHERE role = 'admin'`;
    if (adminCount[0].count === 1) {
      const target = await sql`SELECT role FROM users WHERE userid = ${userIdToDelete}`;
      if (target[0]?.role === 'admin') {
        return NextResponse.json({ error: "Impossible de supprimer le seul administrateur" }, { status: 400 });
      }
    }
  } else if (!targetUserId && !isAdminUser) {
    userIdToDelete = session.userId;
  } else {
    return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
  }

  try {
    await sql`DELETE FROM users WHERE userid = ${userIdToDelete}`;
    const response = NextResponse.json({ message: "Utilisateur supprimé avec succès" });
    if (!targetUserId || userIdToDelete === session.userId) {
      (await cookies()).set('session', '', { expires: new Date(0) });
    }
    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur de suppression" }, { status: 500 });
  }
}