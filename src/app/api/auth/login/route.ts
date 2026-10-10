import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { sendOTPEmail } from '@/lib/email';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const [user] = await sql`
      SELECT userid, email, role, password, is_verified 
      FROM users WHERE email = ${email}
    `;
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });
    if (!user.is_verified) return NextResponse.json({ error: "Please verify your email first" }, { status: 401 });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({ error: "Invalid password" }, { status: 401 });

    // For admin, require OTP – send OTP immediately
    if (user.role === 'admin') {
      // Generate 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in database
      await sql`
        INSERT INTO otp_codes (email, code, type, expires_at, used)
        VALUES (${email}, ${code}, 'admin_login', ${expiresAt}, false)
      `;

      // Send OTP email
      await sendOTPEmail(email, code, 'admin_login');

      // Generate a short-lived JWT token to carry the pending login
      const pendingToken = await new SignJWT({ userId: user.userid, role: user.role, purpose: 'admin_login' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('10m')
        .sign(JWT_SECRET);

      return NextResponse.json({ requiresOtp: true, pendingToken });
    }

    // Regular user: create session directly
    const sessionToken = await new SignJWT({ userId: user.userid, role: user.role })
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

    return NextResponse.json({ success: true, role: user.role, userId: user.userid });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}