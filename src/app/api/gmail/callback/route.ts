/**
 * GET /api/gmail/callback
 * Receives OAuth code, exchanges for tokens, stores in KV.
 * Returns HTML that communicates result back to opener window and auto-closes.
 */
export const runtime = 'edge';
import { NextRequest } from 'next/server';
import { getKV } from '@/lib/cloudflare';

const REDIRECT_URI = 'https://dopamine-app.pages.dev/api/gmail/callback';

function htmlPage(title: string, message: string, success: boolean, account: string) {
  return new Response(`<!DOCTYPE html>
<html><head><title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: #e2e8f0; }
  .card { text-align: center; padding: 3rem; max-width: 400px; }
  .icon { font-size: 3rem; margin-bottom: 1rem; }
  h2 { margin: 0 0 0.5rem; font-size: 1.5rem; }
  p { color: #94a3b8; font-size: 0.875rem; line-height: 1.5; }
  .error { color: #f87171; }
  a { color: #60a5fa; text-decoration: none; }
</style>
</head><body>
<div class="card">
  <div class="icon">${success ? '&#10003;' : '&#10007;'}</div>
  <h2>${title}</h2>
  <p>${message}</p>
  <p id="status" style="margin-top: 1rem; font-size: 0.75rem; color: #64748b;">This window will close automatically&hellip;</p>
</div>
<script>
  try {
    if (window.opener) {
      window.opener.postMessage({
        type: 'gmail-auth-complete',
        success: ${success},
        account: '${account}'
      }, 'https://dopamine-app.pages.dev');
      setTimeout(function() { window.close(); }, 1500);
    } else {
      document.getElementById('status').textContent = 'Redirecting back to Dopamine\\u2026';
      setTimeout(function() { window.location.href = 'https://dopamine-app.pages.dev'; }, 2000);
    }
  } catch(e) {
    document.getElementById('status').textContent = 'You can close this tab and return to the app.';
  }
</script>
</body></html>`, {
    headers: { 'Content-Type': 'text/html' },
  });
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const account = req.nextUrl.searchParams.get('state') ?? 'photography';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    const missing = [!code && 'code', !clientId && 'GOOGLE_CLIENT_ID', !clientSecret && 'GOOGLE_CLIENT_SECRET'].filter(Boolean).join(', ');
    return htmlPage(
      'Connection failed',
      `Missing: ${missing}. Check environment variables in Cloudflare Pages.`,
      false,
      account
    );
  }

  // Exchange auth code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenRes.json() as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (tokens.error || !tokens.refresh_token) {
    return htmlPage(
      'Token exchange failed',
      `Google returned: ${tokens.error_description || tokens.error || 'No refresh token received'}.`,
      false,
      account
    );
  }

  // Store in KV
  const kv = getKV();
  if (!kv) {
    return htmlPage(
      'Storage unavailable',
      'KV namespace not bound. Tokens obtained but could not be saved. Check DOPAMINE_KV binding in Cloudflare Pages settings.',
      false,
      account
    );
  }

  try {
    await kv.put(`gmail-tokens-${account}`, JSON.stringify(tokens));
  } catch (err) {
    return htmlPage(
      'Storage error',
      `Failed to write tokens to KV: ${err instanceof Error ? err.message : String(err)}`,
      false,
      account
    );
  }

  // Verify the write
  const verify = await kv.get(`gmail-tokens-${account}`);
  if (!verify) {
    return htmlPage(
      'Verification failed',
      'Tokens were written to KV but could not be read back.',
      false,
      account
    );
  }

  const emailLabel = account === 'photography' ? 'photography@ryanstanikk.co.uk' : 'rstanikk@gmail.com';
  return htmlPage(
    `Gmail connected for ${account}!`,
    `Your ${emailLabel} account is now linked. Shoot enquiries will be detected automatically.`,
    true,
    account
  );
}
