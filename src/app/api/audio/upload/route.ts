/**
 * POST /api/audio/upload
 * Uploads an audio blob to Cloudflare R2 and returns the permanent URL.
 * Accepts multipart/form-data with a single 'file' field (audio/webm).
 */
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

interface CloudflareEnv {
  DOPAMINE_AUDIO?: R2Bucket;
}

function getR2(): R2Bucket | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require('@cloudflare/next-on-pages');
    const ctx = getRequestContext() as { env: CloudflareEnv };
    return ctx?.env?.DOPAMINE_AUDIO ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const r2 = getR2();

  if (!r2) {
    return NextResponse.json(
      { error: 'R2 not available — audio storage is only active in production.' },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate a unique key: audio/<timestamp>-<random>.webm
    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const key = `audio/${timestamp}-${rand}.webm`;

    const arrayBuffer = await file.arrayBuffer();

    await r2.put(key, arrayBuffer, {
      httpMetadata: { contentType: 'audio/webm' },
    });

    // Return the key — the app fetches audio via /api/audio/[key]
    return NextResponse.json({ key, url: `/api/audio/${key}` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
