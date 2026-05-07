// app/api/messages/route.ts
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// GET /api/messages – récupérer tous les messages (avec jointure sur users)
export async function GET() {
  try {
    const messages = await sql`
      SELECT 
        m.messageid as id,
        m.sendername as "senderName",
        m.senderemail as "senderEmail",
        m.senderphone as "senderPhone",
        m.sendersubject as "subject",
        m.sendermessage as "message",
        m.sendedat as "createdAt",
        m.userid as "userId",
        CONCAT(u.firstname, ' ', u.lastname) as "userName"
      FROM messages m
      LEFT JOIN users u ON m.userid = u.userid
      ORDER BY m.sendedat DESC
    `;
    return NextResponse.json(messages);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// DELETE /api/messages?id=123
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    await sql`DELETE FROM messages WHERE messageid = ${parseInt(id)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}