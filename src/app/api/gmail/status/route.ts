/**
 * GET /api/gmail/status
 * Returns whether Gmail tokens are stored for each account.
 * Used to differentiate "not connected" from "connected but no emails yet".
 * Also returns debug info when ?debug=1 is passed.
 */
export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

interface CloudflareEnv { DOPAMINE_KV?: KVNamespace; }

function getKV(): KVNamespace | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require('@cloudflare/next-on-pages');
    const ctx = getRequestContext() as { env: CloudflareEnv };
    return ctx?.env?.DOPAMINE_KV ?? null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  const kv = getKV();

  if (!kv) {
    return NextResponse.json({
      photography: false,
      personal: false,
      ...(debug ? {
        _debug: {
          kvAvailable: false,
          clientIdSet: !!process.env.GOOGLE_CLIENT_ID,
          clientSecretSet: !!process.env.GOOGLE_CLIENT_SECRET,
          geminiKeySet: !!process.env.GEMINI_API_KEY,
        }
      } : {}),
    });
  }

  const [photographyRaw, personalRaw] = await Promise.all([
    kv.get('gmail-tokens-photography'),
    kv.get('gmail-tokens-personal'),
  ]);

  return NextResponse.json({
    photography: !!photographyRaw,
    personal: !!personalRaw,
    ...(debug ? {
      _debug: {
        kvAvailable: true,
        photographyTokenLength: photographyRaw?.length ?? 0,
        personalTokenLength: personalRaw?.length ?? 0,
        clientIdSet: !!process.env.GOOGLE_CLIENT_ID,
        clientSecretSet: !!process.env.GOOGLE_CLIENT_SECRET,
        geminiKeySet: !!process.env.GEMINI_API_KEY,
      }
    } : {}),
  });
}
