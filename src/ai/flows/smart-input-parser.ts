/**
 * @fileOverview Smart Input Parser - type definitions.
 * The actual Gemini API call lives in /api/ai/route.ts (edge runtime).
 */

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
  shootTime: z.string().nullish(),
  editDueDate: z.string().nullish(),
  price: z.number().nullish(),
  notes: z.string().nullish(),
});

const SmartInputParserOutputSchema = z.discriminatedUnion('type', [
  ProjectOutputSchema,
  ShootOutputSchema,
]);

export type SmartInputParserOutput = z.infer<typeof SmartInputParserOutputSchema>;

export interface SmartInputParserInput {
  prompt: string;
}

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

export async function smartInputParser(input: SmartInputParserInput): Promise<SmartInputParserOutput> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${buildSystemPrompt()}\n\nInput: "${input.prompt}"`,
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

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Gemini API responded with ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawText: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini API returned no content');
  }

  // Strip any accidental markdown code fences
  const cleanJson = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  const parsed = JSON.parse(cleanJson);
  return SmartInputParserOutputSchema.parse(parsed);
}
