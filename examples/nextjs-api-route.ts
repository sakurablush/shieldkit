/**
 * Example Next.js App Router API route (pseudo-code).
 *
 * Copy into `app/api/chat/route.ts` in a Next.js project.
 */
import { generateText } from 'ai';
import { ollama } from 'ollama-ai-provider-v2';

import { createShieldContext, shield } from 'ai-shield';

const model = shield(ollama(process.env.OLLAMA_MODEL ?? 'llama3.2'), {
  mode: 'balanced',
  cost: { maxCostPerSession: 0.25 },
});

export async function POST(request: Request) {
  const body = (await request.json()) as { prompt: string; sessionId?: string };
  const sessionId = body.sessionId ?? 'anonymous';
  createShieldContext(sessionId);

  const result = await generateText({
    model,
    prompt: body.prompt,
    providerOptions: {
      aiShield: {
        sessionId,
        userId: 'demo-user',
      },
    },
  });

  return Response.json({ text: result.text });
}
