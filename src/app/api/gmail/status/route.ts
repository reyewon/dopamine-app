/**
 * GET /api/gmail/status
 * Returns whether Gmail tokens are stored for each account.
 * Used to differentiate "not connected" from "connected but no emails yet".
 * Also returns debug info when ?debug=1 is passed.
 */
export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

interface CloudflareEnv { DOPAMINE_KV?: KVNamespace; }

function getKVDetailed(): { kv: KVNamespace | null; debugInfo: Record<string, unknown> } {
  const info: Record<string, unknown> = {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@cloudflare/next-on-pages');
    info.moduleLoaded = true;
    info.moduleKeys = Object.keys(mod);
    info.hasGetRequestContext = typeof mod.getRequestContext === 'function';

    const ctx = mod.getRequestContext();
    info.ctxExists = !!ctx;
    info.ctxType = typeof ctx;
    if (ctx) {
      info.ctxKeys = Object.keys(ctx);
      info.envExists = !!ctx.env;
      info.envType = typeof ctx.env;
      if (ctx.env) {
        info.envKeys = Object.keys(ctx.env);
        info.kvExists = !!ctx.env.DOPAMINE_KV;
        info.kvType = typeof ctx.env.DOPAMINE_KV;
      }
    }
    return { kv: ctx?.env?.DOPAMINE_KV ?? null, debugInfo: info };
  } catch (err) {
    info.error = err instanceof Error ? err.message : String(err);
    info.errorStack = err instanceof Error ? err.stack?.split('\n').slice(0, 3) : undefined;
    return { kv: null, debugInfo: info };
  }
}

export async function GET(req: NextRequest) {
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  const { kv, debugInfo } = getKVDetailed();

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
          ...debugInfo,
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
