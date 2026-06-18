import type { GuardAction, GuardResult } from '../types.js';
import { normalizeGuardText } from '../utils/guard-normalize.js';

export function keywordGuard(
  text: string,
  options: { deny?: string[]; action?: GuardAction },
): GuardResult {
  const deny = options.deny ?? [];
  const action = options.action ?? 'block';

  if (deny.length === 0) {
    return { guard: 'keywords', triggered: false, action };
  }

  const lowerText = normalizeGuardText(text).toLowerCase();
  const matched: string[] = [];

  for (const keyword of deny) {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      continue;
    }

    const pattern = new RegExp(`\\b${escapeRegExp(normalized)}\\b`, 'i');
    if (pattern.test(lowerText)) {
      matched.push(keyword);
    }
  }

  const triggered = matched.length > 0;
  return {
    guard: 'keywords',
    triggered,
    action,
    summary: triggered ? matched.join(', ') : undefined,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
