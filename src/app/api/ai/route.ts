/**
 * Edge-compatible AI route for the Dopamine app.
 * Calls Gemini directly — no Genkit, no Node.js APIs.
 */
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ProjectOutputSchema = z.object({
  type: z.literal('project'),
  title: z.string(),
  tasks: z.array(z.string()),
});

const ShootOutputSchema = z.object({
  type: z.literal('shoot'),
  title: z.string().nullish(),
  clientName: z.string().nullish(),
  clientEmail: z.string().nullish(),
  clientPhone: z.string().nullish(),
  location: z.string().nullish(),
  shootDate: z.string().nullish(),
  editDueDate: z.string().nullish(),
  price: z.number().nullish(),
  notes: z.string().nullish(),
});

const SmartInputParserOutputSchema = z.discriminatedUnion('type', [
  ProjectOutputSchema,
  ShootOutputSchema,
]);

function buildSystemPrompt(): string {
  return `You are a strict JSON-only data parser for a commercial photographer's business tool.
Output ONLY valid JSON — no markdown, no code fences, no explanation whatsoever.

Current Date: ${new Date().toISOString()}

Determine if the input describes a 'project' (internal multi-step goal) or a 'shoot' (client photography job/appointment).

If PROJECT, return exactly:
{"type":"project","title":"concise project name","tasks":["task 1","task 2","task 3","task 4"]}

If SHOOT, return exactly:
{"type":"shoot","title":"shoot title or null","clientName":"name or null","clientEmail":"email or null","clientPhone":"UK format or null","shootDate":"YYYY-MM-DD or null","editDueDate":"YYYY-MM-DD (shootDate+14 if missing) or null","location":"full address or null","price":number or null,"notes":"extra info or null"}

Parse every detail from the input. Use null for any missing field. Output raw JSON only.`;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    // In Cloudflare Pages with next-on-pages, wrangler.toml [vars] are exposed via process.env
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${buildSystemPrompt()}\n\nInput: "${prompt}"`,
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text().catch(() => '');
      return NextResponse.json(
        { error: `Gemini API error ${geminiRes.status}: ${errorText}` },
        { status: 502 }
      );
    }

    const data = await geminiRes.json();
    const rawText: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json({ error: 'Gemini returned no content' }, { status: 502 });
    }

    // Strip accidental markdown fences
    const cleanJson = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    const parsed = JSON.parse(cleanJson);
    const validated = SmartInputParserOutputSchema.parse(parsed);

    return NextResponse.json(validated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
