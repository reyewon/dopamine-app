/**
 * GET  /api/gmail/inquiries — returns stored inquiries
 * POST /api/gmail/inquiries — marks inquiry as read or addedAsShoot
 * DELETE /api/gmail/inquiries?id=xxx — removes an inquiry
 */
export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getKV } from '@/lib/cloudflare';

export async function GET() {
  const kv = getKV();
  if (!kv) return NextResponse.json([]);
  const raw = await kv.get('email-inquiries');
  return new Response(raw ?? '[]', { headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: NextRequest) {
  const kv = getKV();
  if (!kv) return NextResponse.json({ ok: false });
  const { id, updates } = await req.json() as { id: string; updates: Record<string, unknown> };
  const raw = await kv.get('email-inquiries');
  const inquiries = raw ? JSON.parse(raw) : [];
  const updated = inquiries.map((i: { id: string }) => i.id === id ? { ...i, ...updates } : i);
  await kv.put('email-inquiries', JSON.stringify(updated));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const kv = getKV();
  if (!kv) return NextResponse.json({ ok: false });
  const id = req.nextUrl.searchParams.get('id');
  const raw = await kv.get('email-inquiries');
  const inquiries = raw ? JSON.parse(raw) : [];
  const updated = inquiries.filter((i: { id: string }) => i.id !== id);
  await kv.put('email-inquiries', JSON.stringify(updated));
  return NextResponse.json({ ok: true });
}
