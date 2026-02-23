/**
 * GET /api/gmail/status
 * Returns whether Gmail tokens are stored for each account.
 * Used to differentiate "not connected" from "connected but no emails yet".
 */
export const runtime = 'edge';
import { NextResponse } from 'next/server';

interface CloudflareEnv { DOPAMINE_KV?: KVNamespace; }

function getKV(): KVNamespace | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require('@cloudflare/next-on-pages');
    const ctx = getRequestContext() as { env: CloudflareEnv };
    return ctx?.env?.DOPAMINE_KV ?? null;
  } catch { return null; }
}

export async function GET() {
  const kv = getKV();
  if (!kv) {
    return NextResponse.json({ photography: false, personal: false });
  }

  const [photographyRaw, personalRaw] = await Promise.all([
    kv.get('gmail-tokens-photography'),
    kv.get('gmail-tokens-personal'),
  ]);

  return NextResponse.json({
    photography: !!photographyRaw,
    personal: !!personalRaw,
  });
}
