import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const passkeys = await sql`SELECT id FROM passkeys WHERE userid = ${session.userId}`;
  return NextResponse.json({ hasPasskey: passkeys.length > 0 });
}