import type { GuardAction, GuardResult } from '../types.js';
import { normalizeGuardText } from '../utils/guard-normalize.js';

const INJECTION_PATTERNS: Array<{ pattern: RegExp; weight: number; label: string }> = [
  {
    pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
    weight: 1,
    label: 'ignore-instructions',
  },
  {
    pattern: /disregard\s+(all\s+)?(previous|prior|system)\s+(instructions|prompts)/i,
    weight: 1,
    label: 'disregard-instructions',
  },
  {
    pattern: /you\s+are\s+now\s+(?:a|an|the)\s+/i,
    weight: 0.8,
    label: 'role-override',
  },
  {
    pattern: /system\s*:\s*/i,
    weight: 0.5,
    label: 'system-delimiter',
  },
  {
    pattern: /<\s*\/?\s*(system|assistant|user)\s*>/i,
    weight: 0.7,
    label: 'xml-role-tag',
  },
  {
    pattern: /reveal\s+(your\s+)?(system|hidden|secret)\s+(prompt|instructions)/i,
    weight: 0.9,
    label: 'prompt-leak',
  },
  {
    pattern: /jailbreak|DAN\s+mode|do\s+anything\s+now/i,
    weight: 0.9,
    label: 'jailbreak',
  },
];

export function injectionGuard(
  text: string,
  options: { threshold?: number; action?: GuardAction },
): GuardResult {
  const threshold = options.threshold ?? 0.5;
  const action = options.action ?? 'block';
  const normalizedText = normalizeGuardText(text);

  let score = 0;
  const matches: string[] = [];

  for (const { pattern, weight, label } of INJECTION_PATTERNS) {
    if (pattern.test(normalizedText)) {
      score += weight;
      matches.push(label);
    }
  }

  const triggered = score >= threshold;
  return {
    guard: 'injection',
    triggered,
    action,
    summary: triggered ? matches.join(', ') : undefined,
  };
}
