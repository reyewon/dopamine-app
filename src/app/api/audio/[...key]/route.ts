/**
 * GET /api/audio/<key>
 * Streams an audio object from R2.
 */
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getR2 } from '@/lib/cloudflare';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const r2 = getR2();

  if (!r2) {
    return NextResponse.json({ error: 'R2 not available' }, { status: 503 });
  }

  const { key: keyParts } = await params;
  const key = keyParts.join('/');

  try {
    const object = await r2.get(key);

    if (!object) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=31536000, immutable');

    return new Response(object.body, { headers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
