import type { LanguageModelV3StreamPart, LanguageModelV3Usage } from '@ai-sdk/provider';

export function createStreamTextCollector(): {
  transform: TransformStream<LanguageModelV3StreamPart, LanguageModelV3StreamPart>;
  getText: () => string;
} {
  const textBlocks = new Map<string, string>();
  let generatedText = '';

  const transform = new TransformStream<
    LanguageModelV3StreamPart,
    LanguageModelV3StreamPart
  >({
    transform(chunk, controller) {
      switch (chunk.type) {
        case 'text-start': {
          textBlocks.set(chunk.id, '');
          break;
        }
        case 'text-delta': {
          const existing = textBlocks.get(chunk.id) ?? '';
          const updated = existing + chunk.delta;
          textBlocks.set(chunk.id, updated);
          generatedText += chunk.delta;
          break;
        }
        case 'text-end': {
          break;
        }
        default:
          break;
      }
      controller.enqueue(chunk);
    },
  });

  return {
    transform,
    getText: () => generatedText,
  };
}

export async function collectStreamText(
  stream: ReadableStream<LanguageModelV3StreamPart>,
): Promise<string> {
  const collected = await collectStreamTextAndUsage(stream);
  return collected.text;
}

export async function collectStreamTextAndUsage(
  stream: ReadableStream<LanguageModelV3StreamPart>,
): Promise<{ text: string; usage?: LanguageModelV3Usage }> {
  const reader = stream.getReader();
  let text = '';
  let usage: LanguageModelV3Usage | undefined;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value.type === 'text-delta') {
        text += value.delta;
      }
      if (value.type === 'finish') {
        usage = value.usage;
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { text, usage };
}
