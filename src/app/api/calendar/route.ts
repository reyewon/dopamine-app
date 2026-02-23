/**
 * GET  /api/calendar  → { connected: boolean }
 * POST /api/calendar  → Create an event in the Photography Google Calendar
 *
 * Body: { title, shootDate (YYYY-MM-DD), shootTime? (HH:MM, GMT), location?, clientName?, price? }
 * If shootTime is provided, a timed event is created (start = shootDate+shootTime UTC, end = +4 hours).
 * Otherwise an all-day event is created.
 */
export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getKV } from '@/lib/cloudflare';

const PHOTOGRAPHY_CALENDAR_ID =
  'f4ea15fdd1ea8f5f2782618c36cd8de9422488ed6243d9707e0ff5de0ecda514@group.calendar.google.com';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function getAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json() as { access_token?: string };
  return data.access_token ?? null;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const kv = getKV();
  if (!kv) return NextResponse.json({ connected: false }, { headers: CORS_HEADERS });
  const stored = await kv.get('calendar-tokens');
  return NextResponse.json({ connected: !!stored }, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const kv = getKV();
  if (!kv) {
    return NextResponse.json({ error: 'KV unavailable' }, { status: 503, headers: CORS_HEADERS });
  }

  const stored = await kv.get('calendar-tokens');
  if (!stored) {
    return NextResponse.json({ error: 'Calendar not connected' }, { status: 401, headers: CORS_HEADERS });
  }

  const tokens = JSON.parse(stored) as { refresh_token: string };
  const accessToken = await getAccessToken(tokens.refresh_token);
  if (!accessToken) {
    return NextResponse.json({ error: 'Could not refresh access token' }, { status: 500, headers: CORS_HEADERS });
  }

  const body = await req.json() as {
    title?: string;
    shootDate?: string;
    shootTime?: string;
    location?: string;
    clientName?: string;
    price?: number;
  };

  const { title, shootDate, shootTime, location, clientName, price } = body;

  if (!shootDate) {
    return NextResponse.json({ error: 'shootDate is required' }, { status: 400, headers: CORS_HEADERS });
  }

  // Ensure we have a clean YYYY-MM-DD string (Date objects serialise as ISO strings)
  const dateStr = shootDate.split('T')[0];

  const descriptionParts: string[] = [];
  if (clientName) descriptionParts.push(`Client: ${clientName}`);
  if (price) descriptionParts.push(`Fee: £${price}`);

  // Build start/end — timed event if shootTime is provided, otherwise all-day
  let eventStart: { date: string } | { dateTime: string; timeZone: string };
  let eventEnd: { date: string } | { dateTime: string; timeZone: string };

  if (shootTime && /^\d{2}:\d{2}$/.test(shootTime)) {
    const startDateTimeStr = `${dateStr}T${shootTime}:00Z`;
    const startMs = new Date(startDateTimeStr).getTime();
    const endMs = startMs + 4 * 60 * 60 * 1000; // +4 hours
    const endDateTimeStr = new Date(endMs).toISOString().replace('.000Z', 'Z');
    eventStart = { dateTime: startDateTimeStr, timeZone: 'UTC' };
    eventEnd = { dateTime: endDateTimeStr, timeZone: 'UTC' };
  } else {
    eventStart = { date: dateStr };
    eventEnd = { date: dateStr };
  }

  const event = {
    summary: title || 'Photography Shoot',
    location: location || '',
    description: descriptionParts.join('\n'),
    start: eventStart,
    end: eventEnd,
  };

  const calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(PHOTOGRAPHY_CALENDAR_ID)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!calRes.ok) {
    const err = await calRes.json() as { error?: { message?: string } };
    return NextResponse.json(
      { error: err.error?.message ?? 'Calendar API error' },
      { status: calRes.status, headers: CORS_HEADERS }
    );
  }

  const created = await calRes.json() as { id: string; htmlLink: string };
  return NextResponse.json({ ok: true, eventId: created.id, htmlLink: created.htmlLink }, { headers: CORS_HEADERS });
}
