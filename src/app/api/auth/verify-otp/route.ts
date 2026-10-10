import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, code, type } = await req.json();
    if (!email || !code || !type) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const [otp] = await sql`
      SELECT * FROM otp_codes
      WHERE email = ${email} AND code = ${code} AND type = ${type} AND used = false
      ORDER BY created_at DESC LIMIT 1
    `;
    if (!otp) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }
    if (new Date() > new Date(otp.expires_at)) {
      return NextResponse.json({ error: 'Code expired' }, { status: 400 });
    }
    await sql`UPDATE otp_codes SET used = true WHERE id = ${otp.id}`;

    if (type === 'signup') {
      await sql`UPDATE users SET is_verified = true WHERE email = ${email}`;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}