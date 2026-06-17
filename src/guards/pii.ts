import type { GuardAction, GuardResult } from '../types.js';

const PII_PATTERNS: Array<{ type: string; pattern: RegExp }> = [
  { type: 'email', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  {
    type: 'phone',
    pattern: /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,
  },
  { type: 'ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  {
    type: 'credit-card',
    pattern: /\b(?:\d[ -]*?){13,19}\b/g,
  },
];

function redactMatch(type: string, value: string): string {
  if (type === 'credit-card' && !isLikelyCreditCard(value)) {
    return value;
  }
  return `[REDACTED_PII:${type}]`;
}

function isLikelyCreditCard(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }
  return luhnCheck(digits);
}

function luhnCheck(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number.parseInt(digits.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) {
        n -= 9;
      }
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function piiGuard(text: string, options: { action?: GuardAction }): GuardResult {
  const action = options.action ?? 'redact';
  let modifiedText = text;
  let triggered = false;
  const types = new Set<string>();

  for (const { type, pattern } of PII_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(modifiedText)) {
      triggered = true;
      types.add(type);
      pattern.lastIndex = 0;
      modifiedText = modifiedText.replace(pattern, (match) => redactMatch(type, match));
    }
  }

  return {
    guard: 'pii',
    triggered,
    action,
    summary: triggered ? [...types].join(', ') : undefined,
    modifiedText: triggered ? modifiedText : undefined,
  };
}
