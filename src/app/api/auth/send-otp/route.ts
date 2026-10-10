import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendOTPEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email, type } = await req.json();
    if (!email || !type) {
      return NextResponse.json({ error: 'Missing email or type' }, { status: 400 });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await sql`
      INSERT INTO otp_codes (email, code, type, expires_at, used)
      VALUES (${email}, ${code}, ${type}, ${expiresAt}, false)
    `;

    await sendOTPEmail(email, code, type as any);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}