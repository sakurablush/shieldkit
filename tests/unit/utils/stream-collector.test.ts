import { describe, expect, it } from 'vitest';

import {
  collectStreamText,
  collectStreamTextAndUsage,
  createStreamTextCollector,
} from '../../../src/utils/stream-collector.js';
import { createUsageFromCounts } from '../../../src/utils/usage.js';

function makeDeltaStream(chunks: string[], usage = createUsageFromCounts(1, 2)) {
  return new ReadableStream({
    start(controller) {
      for (const delta of chunks) {
        controller.enqueue({ type: 'text-delta', id: '1', delta });
      }
      controller.enqueue({ type: 'finish', finishReason: 'stop', usage });
      controller.close();
    },
  });
}

describe('stream collector', () => {
  it('collects text and usage from stream parts', async () => {
    const collected = await collectStreamTextAndUsage(
      makeDeltaStream(['Hello ', 'world']),
    );
    expect(collected.text).toBe('Hello world');
    expect(collected.usage?.inputTokens.total).toBe(1);
  });

  it('collects text via collectStreamText helper', async () => {
    const text = await collectStreamText(makeDeltaStream(['ok']));
    expect(text).toBe('ok');
  });

  it('accumulates deltas in transform collector', async () => {
    const { transform, getText } = createStreamTextCollector();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue({ type: 'text-start', id: '1' });
        controller.enqueue({ type: 'text-delta', id: '1', delta: 'abc' });
        controller.enqueue({ type: 'text-end', id: '1' });
        controller.close();
      },
    });

    const reader = stream.pipeThrough(transform).getReader();
    while (!(await reader.read()).done) {
      /* drain */
    }
    expect(getText()).toBe('abc');
  });
});
