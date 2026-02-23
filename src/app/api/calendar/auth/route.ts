/**
 * GET /api/calendar/auth
 * Redirects to Google OAuth consent screen requesting Calendar access.
 */
export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

const SCOPES = 'https://www.googleapis.com/auth/calendar';
const REDIRECT_URI = 'https://dopamine-app.pages.dev/api/calendar/callback';

export async function GET(req: NextRequest) {
  void req;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: 'GOOGLE_CLIENT_ID not set' }, { status: 500 });

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');

  return NextResponse.redirect(url.toString());
}
