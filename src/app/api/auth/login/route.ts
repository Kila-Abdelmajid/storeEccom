import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const [user] = await sql`SELECT userid, email, role, password FROM users WHERE email = ${email}`;
    if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 401 });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });

    // Create session with userId and role
    const session = await encrypt({ 
      userId: user.userid, 
      role: user.role,
      // optionally: email, firstName, etc.
    });

   (await cookies()).set('session', session, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days (optional)
});

    // Return role so the frontend can redirect immediately
    return NextResponse.json({ 
      message: "Login success", 
      role: user.role,
      userId: user.userid
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

