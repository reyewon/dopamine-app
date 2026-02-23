/**
 * Invoice sync API — stores Pixieset invoice data in Cloudflare KV.
 * GET  /api/invoices — returns saved invoices
 * POST /api/invoices — saves/merges invoice data (pix-XXX IDs from scraper override manual entries)
 */
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getKV } from '@/lib/cloudflare';

const KV_KEY = 'invoices';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const kv = getKV();
  if (!kv) return NextResponse.json([], { status: 200, headers: CORS_HEADERS });

  try {
    const raw = await kv.get(KV_KEY);
    if (!raw) return NextResponse.json([], { status: 200, headers: CORS_HEADERS });
    return new Response(raw, {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (err) {
    console.error('Invoices GET error:', err);
    return NextResponse.json({ error: 'Failed to read invoices' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  const kv = getKV();
  if (!kv) return NextResponse.json({ ok: true, persisted: false }, { status: 200, headers: CORS_HEADERS });

  try {
    const incoming: Invoice[] = await request.json();

    // Load existing invoices
    const raw = await kv.get(KV_KEY);
    const existing: Invoice[] = raw ? JSON.parse(raw) : [];

    // Merge: scraper (pix-XXX) entries override existing ones with the same id
    const merged = mergeInvoices(existing, incoming);

    await kv.put(KV_KEY, JSON.stringify(merged));
    return NextResponse.json({ ok: true, persisted: true, count: merged.length }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error('Invoices POST error:', err);
    return NextResponse.json({ error: 'Failed to save invoices' }, { status: 500, headers: CORS_HEADERS });
  }
}

interface Invoice {
  id: string;
  number?: string;
  amount?: number;
  client?: string;
  project?: string;
  status?: 'paid' | 'unpaid' | 'draft' | 'cancelled';
  dueDate?: string;
  createdDate?: string;
  [key: string]: unknown;
}

function mergeInvoices(existing: Invoice[], incoming: Invoice[]): Invoice[] {
  const map = new Map<string, Invoice>();

  // Load existing first
  for (const inv of existing) {
    map.set(inv.id, inv);
  }

  // Incoming overrides — scraper data always wins
  for (const inv of incoming) {
    map.set(inv.id, inv);
  }

  // Return sorted newest-first by createdDate/id
  return Array.from(map.values()).sort((a, b) => {
    const aDate = a.createdDate ?? a.id;
    const bDate = b.createdDate ?? b.id;
    return bDate.localeCompare(aDate);
  });
}
