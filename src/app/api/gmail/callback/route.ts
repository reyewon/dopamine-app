/**
 * GET /api/gmail/callback
 * Receives OAuth code, exchanges for tokens, stores in KV.
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

const REDIRECT_URI = 'https://dopamine-app.pages.dev/api/gmail/callback';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const account = req.nextUrl.searchParams.get('state') ?? 'photography';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: REDIRECT_URI, grant_type: 'authorization_code' }),
  });

  const tokens = await tokenRes.json() as { access_token?: string; refresh_token?: string; error?: string };
  if (tokens.error || !tokens.refresh_token) {
    return NextResponse.json({ error: tokens.error ?? 'No refresh token' }, { status: 400 });
  }

  const kv = getKV();
  if (kv) {
    await kv.put(`gmail-tokens-${account}`, JSON.stringify(tokens));
  }

  return new Response(`<html><body><h2>✅ Gmail connected for ${account}!</h2><p>You can close this tab.</p></body></html>`, {
    headers: { 'Content-Type': 'text/html' },
  });
}
