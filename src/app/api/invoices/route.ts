/**
 * Invoice sync API — stores Pixieset invoice data in Cloudflare KV.
 * GET  /api/invoices — returns saved invoices
 * POST /api/invoices — saves/merges invoice data (pix-XXX IDs from scraper override manual entries)
 */
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

interface CloudflareEnv {
  DOPAMINE_KV?: KVNamespace;
}

const KV_KEY = 'invoices';

function getKV(): KVNamespace | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require('@cloudflare/next-on-pages');
    const ctx = getRequestContext() as { env: CloudflareEnv };
    return ctx?.env?.DOPAMINE_KV ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const kv = getKV();
  if (!kv) return NextResponse.json([], { status: 200 });

  try {
    const raw = await kv.get(KV_KEY);
    if (!raw) return NextResponse.json([], { status: 200 });
    return new Response(raw, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Invoices GET error:', err);
    return NextResponse.json({ error: 'Failed to read invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const kv = getKV();
  if (!kv) return NextResponse.json({ ok: true, persisted: false }, { status: 200 });

  try {
    const incoming: Invoice[] = await request.json();

    // Load existing invoices
    const raw = await kv.get(KV_KEY);
    const existing: Invoice[] = raw ? JSON.parse(raw) : [];

    // Merge: scraper (pix-XXX) entries override existing ones with the same id
    const merged = mergeInvoices(existing, incoming);

    await kv.put(KV_KEY, JSON.stringify(merged));
    return NextResponse.json({ ok: true, persisted: true, count: merged.length });
  } catch (err) {
    console.error('Invoices POST error:', err);
    return NextResponse.json({ error: 'Failed to save invoices' }, { status: 500 });
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
