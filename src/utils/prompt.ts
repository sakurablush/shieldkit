import type {
  JSONValue,
  LanguageModelV3CallOptions,
  LanguageModelV3Prompt,
} from '@ai-sdk/provider';

import { piiGuard } from '../guards/pii.js';
import type { ShieldProviderOptions } from '../types.js';

const SHIELD_PROVIDER_KEY = 'aiShield';

export function getShieldProviderOptions(
  providerOptions: LanguageModelV3CallOptions['providerOptions'],
): ShieldProviderOptions {
  const raw = providerOptions?.[SHIELD_PROVIDER_KEY];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const options = raw as Record<string, unknown>;
  const result: ShieldProviderOptions = {};

  if (typeof options.sessionId === 'string') {
    result.sessionId = options.sessionId;
  }
  if (typeof options.userId === 'string') {
    result.userId = options.userId;
  }
  if (typeof options.requestId === 'string') {
    result.requestId = options.requestId;
  }
  if (typeof options.approved === 'boolean') {
    result.approved = options.approved;
  }
  if (
    options.metadata &&
    typeof options.metadata === 'object' &&
    !Array.isArray(options.metadata)
  ) {
    result.metadata = options.metadata as Record<string, unknown>;
  }
  if (options.outputSchema && typeof options.outputSchema === 'object') {
    result.outputSchema = options.outputSchema as ShieldProviderOptions['outputSchema'];
  }

  return result;
}

export function mergeShieldProviderOptions(
  providerOptions: LanguageModelV3CallOptions['providerOptions'],
  patch: ShieldProviderOptions,
): LanguageModelV3CallOptions['providerOptions'] {
  const existing = getShieldProviderOptions(providerOptions);
  return {
    ...providerOptions,
    [SHIELD_PROVIDER_KEY]: {
      ...existing,
      ...patch,
    } as Record<string, JSONValue>,
  };
}

export function extractPromptText(prompt: LanguageModelV3Prompt): string {
  const parts: string[] = [];

  for (const message of prompt) {
    if (message.role === 'system') {
      parts.push(message.content);
      continue;
    }

    if (message.role === 'user' || message.role === 'assistant') {
      for (const part of message.content) {
        if (part.type === 'text') {
          parts.push(part.text);
        }
      }
      continue;
    }

    if (message.role === 'tool') {
      for (const part of message.content) {
        if (part.type === 'tool-result') {
          parts.push(JSON.stringify(part.output));
        }
      }
    }
  }

  return parts.join('\n');
}

export function redactPromptPii(prompt: LanguageModelV3Prompt): LanguageModelV3Prompt {
  return prompt.map((message) => {
    if (message.role === 'system') {
      const redacted = piiGuard(message.content, { action: 'redact' });
      return redacted.modifiedText
        ? { ...message, content: redacted.modifiedText }
        : message;
    }

    if (message.role === 'user' || message.role === 'assistant') {
      const content = message.content.map((part) => {
        if (part.type !== 'text') {
          return part;
        }
        const redacted = piiGuard(part.text, { action: 'redact' });
        return redacted.modifiedText ? { ...part, text: redacted.modifiedText } : part;
      });
      return { ...message, content } as typeof message;
    }

    return message;
  });
}

export function replacePromptText(
  prompt: LanguageModelV3Prompt,
  transform: (text: string) => string,
): LanguageModelV3Prompt {
  return prompt.map((message) => {
    if (message.role === 'system') {
      return { ...message, content: transform(message.content) };
    }

    if (message.role === 'user') {
      return {
        ...message,
        content: message.content.map((part) =>
          part.type === 'text' ? { ...part, text: transform(part.text) } : part,
        ),
      };
    }

    if (message.role === 'assistant') {
      return {
        ...message,
        content: message.content.map((part) =>
          part.type === 'text' ? { ...part, text: transform(part.text) } : part,
        ),
      };
    }

    return message;
  });
}

export function appendUserMessage(
  prompt: LanguageModelV3Prompt,
  text: string,
): LanguageModelV3Prompt {
  return [
    ...prompt,
    {
      role: 'user',
      content: [{ type: 'text', text }],
    },
  ];
}

export function extractTextFromContent(
  content: Array<{ type: string; text?: string }>,
): string {
  return content
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

export function replaceTextInContent<T extends { type: string; text?: string }>(
  content: T[],
  newText: string,
): T[] {
  let replaced = false;
  return content.map((part) => {
    if (!replaced && part.type === 'text') {
      replaced = true;
      return { ...part, text: newText };
    }
    return part;
  });
}

export function stripMarkdownJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = /^```(?:json)?\s*([\s\S]*?)```$/i.exec(trimmed);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }
  return trimmed;
}

export function createRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
