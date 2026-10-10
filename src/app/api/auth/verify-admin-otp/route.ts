import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req: Request) {
  try {
    const { pendingToken, code } = await req.json();
    if (!pendingToken || !code) {
      return NextResponse.json({ error: 'Missing token or code' }, { status: 400 });
    }

    // Verify pending token
    let payload;
    try {
      const { payload: verified } = await jwtVerify(pendingToken, JWT_SECRET);
      payload = verified;
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
    if (payload.purpose !== 'admin_login') {
      return NextResponse.json({ error: 'Invalid token purpose' }, { status: 400 });
    }

    // Extract and validate userId
    const userId = payload.userId as number;
    const role = payload.role as string;
    if (!userId || typeof userId !== 'number') {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
    }

    // Verify OTP
    const [user] = await sql`
      SELECT email FROM users WHERE userid = ${userId}
    `;
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const [otp] = await sql`
      SELECT * FROM otp_codes
      WHERE email = ${user.email} AND code = ${code} AND type = 'admin_login' AND used = false
      ORDER BY created_at DESC LIMIT 1
    `;
    if (!otp || new Date() > new Date(otp.expires_at)) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }
    await sql`UPDATE otp_codes SET used = true WHERE id = ${otp.id}`;

    // Create final session
    const sessionToken = await new SignJWT({ userId, role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    (await cookies()).set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ success: true, role });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}