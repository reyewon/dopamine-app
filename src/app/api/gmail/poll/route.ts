/**
 * GET /api/gmail/poll
 * Checks both Gmail accounts for new shoot inquiry emails.
 * Uses Gemini AI to classify emails as shoot inquiries.
 * Stores new inquiries in KV under 'email-inquiries'.
 * Called client-side every 5 minutes.
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

interface GmailTokens { access_token?: string; refresh_token?: string; expires_in?: number; token_type?: string; }
interface EmailInquiry {
  id: string;
  account: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  extractedData: {
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    shootType?: string;
    shootDate?: string;
    location?: string;
    notes?: string;
  };
  read: boolean;
  addedAsShoot: boolean;
}

async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret, grant_type: 'refresh_token' }),
  });
  const data = await res.json() as { access_token?: string };
  return data.access_token ?? null;
}

async function fetchGmailMessages(accessToken: string, afterTimestamp: number): Promise<{ id: string; threadId: string }[]> {
  // Pre-filter at Gmail level: inbox only, not sent by user, exclude common spam/service senders
  const query = [
    'is:inbox',
    `after:${Math.floor(afterTimestamp / 1000)}`,
    '-from:me',
    '-from:noreply',
    '-from:donotreply',
    '-from:no-reply',
    '-from:mailchimp',
    '-from:newsletter',
    '-from:notifications',
    '-category:promotions',
    '-category:updates',
    '-category:social',
  ].join(' ');
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json() as { messages?: { id: string; threadId: string }[] };
  return data.messages ?? [];
}

async function fetchEmailContent(accessToken: string, messageId: string): Promise<{ subject: string; from: string; date: string; body: string } | null> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const msg = await res.json() as {
    payload?: {
      headers?: { name: string; value: string }[];
      body?: { data?: string };
      parts?: { mimeType: string; body?: { data?: string } }[];
    };
  };

  const headers = msg.payload?.headers ?? [];
  const subject = headers.find(h => h.name === 'Subject')?.value ?? '(no subject)';
  const from = headers.find(h => h.name === 'From')?.value ?? '';
  const date = headers.find(h => h.name === 'Date')?.value ?? '';

  // Extract body text
  let body = '';
  const bodyData = msg.payload?.body?.data;
  if (bodyData) {
    body = atob(bodyData.replace(/-/g, '+').replace(/_/g, '/'));
  } else {
    const textPart = msg.payload?.parts?.find(p => p.mimeType === 'text/plain');
    if (textPart?.body?.data) {
      body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }
  }

  return { subject, from, date, body: body.slice(0, 2000) };
}

async function classifyWithGemini(apiKey: string, email: { subject: string; from: string; body: string }): Promise<{ isInquiry: boolean; extractedData: EmailInquiry['extractedData'] }> {
  const prompt = `You are a strict email filter for Ryan Stanikk, a freelance commercial photographer based in Southampton, UK.

Your ONLY job is to identify genuine shoot booking enquiries from real potential clients — someone who actually wants to hire Ryan to photograph something for them.

Email to analyse:
Subject: ${email.subject}
From: ${email.from}
Body: ${email.body}

IMMEDIATELY return isInquiry: false for ANY of the following — no exceptions:
- Photo editing, retouching, culling, or clipping mask services
- SEO, web design, digital marketing, or social media services
- Cold sales pitches or "we can help your business" emails
- Newsletters, mailing lists, or automated marketing emails
- Unsolicited offers from other photographers or creative agencies
- Anyone offering outsourced services (editing, printing, album design, etc.)
- Emails from noreply@, donotreply@, or obvious automated senders
- Emails that don't mention hiring a photographer or booking a shoot
- Generic "hi I found your website" opener with a sales pitch
- Any email where the sender is trying to sell Ryan something

Return isInquiry: true ONLY if ALL of these are true:
1. A real human is writing to Ryan to enquire about booking him as a photographer
2. The email is clearly about a specific shoot (wedding, portrait, commercial, event, product, etc.)
3. There is no sign the sender is a business trying to sell services

Return ONLY valid JSON, no markdown:
{"isInquiry": true/false, "clientName": "name or null", "clientEmail": "reply-to email or null", "clientPhone": "UK format or null", "shootType": "e.g. wedding/portrait/commercial/product/event or null", "shootDate": "YYYY-MM-DD or null", "location": "location or null", "notes": "budget, brief, or other key details or null"}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: 'application/json', temperature: 0.1, maxOutputTokens: 512 },
      }),
    }
  );

  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  try {
    const parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '').trim());
    return {
      isInquiry: !!parsed.isInquiry,
      extractedData: {
        clientName: parsed.clientName ?? undefined,
        clientEmail: parsed.clientEmail ?? undefined,
        clientPhone: parsed.clientPhone ?? undefined,
        shootType: parsed.shootType ?? undefined,
        shootDate: parsed.shootDate ?? undefined,
        location: parsed.location ?? undefined,
        notes: parsed.notes ?? undefined,
      },
    };
  } catch {
    return { isInquiry: false, extractedData: {} };
  }
}

export async function GET() {
  const kv = getKV();
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!kv || !clientId || !clientSecret || !geminiKey) {
    return NextResponse.json({ ok: false, reason: 'Missing credentials' });
  }

  const accounts = ['photography', 'personal'] as const;
  const newInquiries: EmailInquiry[] = [];

  // Load existing inquiries to avoid duplicates
  const existingRaw = await kv.get('email-inquiries');
  const existing: EmailInquiry[] = existingRaw ? JSON.parse(existingRaw) : [];
  const existingIds = new Set(existing.map(e => e.id));

  // Load last-polled timestamp
  const lastPolledRaw = await kv.get('gmail-last-polled');
  const lastPolled = lastPolledRaw ? parseInt(lastPolledRaw) : Date.now() - 24 * 60 * 60 * 1000; // default: last 24h

  for (const account of accounts) {
    const tokensRaw = await kv.get(`gmail-tokens-${account}`);
    if (!tokensRaw) continue;

    const tokens: GmailTokens = JSON.parse(tokensRaw);
    if (!tokens.refresh_token) continue;

    const accessToken = await refreshAccessToken(tokens.refresh_token, clientId, clientSecret);
    if (!accessToken) continue;

    const messages = await fetchGmailMessages(accessToken, lastPolled);

    for (const msg of messages) {
      if (existingIds.has(msg.id)) continue;

      const content = await fetchEmailContent(accessToken, msg.id);
      if (!content) continue;

      const { isInquiry, extractedData } = await classifyWithGemini(geminiKey, content);
      if (!isInquiry) continue;

      newInquiries.push({
        id: msg.id,
        account,
        subject: content.subject,
        from: content.from,
        date: content.date,
        body: content.body,
        extractedData,
        read: false,
        addedAsShoot: false,
      });
    }
  }

  // Save updated inquiries and timestamp
  const updated = [...newInquiries, ...existing].slice(0, 50); // keep max 50
  await kv.put('email-inquiries', JSON.stringify(updated));
  await kv.put('gmail-last-polled', Date.now().toString());

  return NextResponse.json({ ok: true, newCount: newInquiries.length, total: updated.length });
}
