import type { LanguageModelV3StreamPart, LanguageModelV3Usage } from '@ai-sdk/provider';

type StreamTransformPair = {
  readable: ReadableStream<LanguageModelV3StreamPart>;
  writable: WritableStream<LanguageModelV3StreamPart>;
};

function processStreamPart(
  chunk: LanguageModelV3StreamPart,
  textBlocks: Map<string, string>,
  onDelta: (delta: string) => void,
): void {
  switch (chunk.type) {
    case 'text-start': {
      textBlocks.set(chunk.id, '');
      break;
    }
    case 'text-delta': {
      const existing = textBlocks.get(chunk.id) ?? '';
      const updated = existing + chunk.delta;
      textBlocks.set(chunk.id, updated);
      onDelta(chunk.delta);
      break;
    }
    case 'text-end': {
      break;
    }
    default:
      break;
  }
}

export function createStreamTextCollector(): {
  transform: StreamTransformPair;
  getText: () => string;
} {
  const textBlocks = new Map<string, string>();
  let generatedText = '';

  let readableController:
    | ReadableStreamDefaultController<LanguageModelV3StreamPart>
    | undefined;

  const readable = new ReadableStream<LanguageModelV3StreamPart>({
    start(controller) {
      readableController = controller;
    },
  });

  const writable = new WritableStream<LanguageModelV3StreamPart>({
    write(chunk) {
      processStreamPart(chunk, textBlocks, (delta) => {
        generatedText += delta;
      });
      readableController?.enqueue(chunk);
    },
    close() {
      readableController?.close();
    },
    abort(reason) {
      readableController?.error(reason);
    },
  });

  return {
    transform: { readable, writable },
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
