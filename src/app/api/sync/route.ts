/**
 * Cross-device sync API using Cloudflare KV.
 * GET  /api/sync  — returns saved app state
 * POST /api/sync  — saves app state
 *
 * In production this runs as a Cloudflare Pages Function with KV bound as DOPAMINE_KV.
 * In local dev it gracefully returns null (falls back to localStorage).
 */

export const runtime = 'edge';

interface CloudflareEnv {
  DOPAMINE_KV?: KVNamespace;
}

function getKV(): KVNamespace | null {
  try {
    // @cloudflare/next-on-pages exposes the Cloudflare environment via getRequestContext
    // We use a dynamic require so local dev doesn't crash
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

  if (!kv) {
    // Local dev — no KV available
    return Response.json(null, { status: 200 });
  }

  try {
    const raw = await kv.get('state');
    if (!raw) {
      return Response.json(null, { status: 200 });
    }
    return new Response(raw, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('KV GET error:', err);
    return Response.json({ error: 'Failed to read state' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const kv = getKV();

  if (!kv) {
    // Local dev — silently succeed
    return Response.json({ ok: true, persisted: false }, { status: 200 });
  }

  try {
    const body = await request.text();
    // Basic validation — must be valid JSON
    JSON.parse(body);
    await kv.put('state', body);
    return Response.json({ ok: true, persisted: true }, { status: 200 });
  } catch (err) {
    console.error('KV POST error:', err);
    return Response.json({ error: 'Failed to save state' }, { status: 500 });
  }
}
