import { stripMarkdownJsonFences } from './prompt.js';

export interface JsonRepairResult {
  text: string;
  repaired: boolean;
  error?: string;
}

export function repairJson(text: string): JsonRepairResult {
  const stripped = stripMarkdownJsonFences(text);

  try {
    JSON.parse(stripped);
    return { text: stripped, repaired: stripped !== text.trim() };
  } catch (initialError) {
    const repaired = applyRepairs(stripped);
    try {
      JSON.parse(repaired);
      return { text: repaired, repaired: true };
    } catch (finalError) {
      return {
        text: stripped,
        repaired: false,
        error:
          finalError instanceof Error
            ? finalError.message
            : initialError instanceof Error
              ? initialError.message
              : 'Invalid JSON',
      };
    }
  }
}

function applyRepairs(text: string): string {
  let result = text.trim();

  result = result.replace(/,\s*([}\]])/g, '$1');
  result = result.replace(/([{,]\s*)'([^']*?)'\s*:/g, '$1"$2":');
  result = result.replace(/:\s*'([^']*?)'/g, ': "$1"');
  result = result.replace(/\bundefined\b/g, 'null');
  result = result.replace(/\bNaN\b/g, 'null');
  result = result.replace(/\bInfinity\b/g, 'null');

  result = closeOpenStructures(result);

  return result;
}

function closeOpenStructures(text: string): string {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (const char of text) {
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{' || char === '[') {
      stack.push(char);
      continue;
    }

    if (char === '}' && stack.at(-1) === '{') {
      stack.pop();
      continue;
    }

    if (char === ']' && stack.at(-1) === '[') {
      stack.pop();
    }
  }

  let result = text;
  if (inString) {
    result += '"';
  }

  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const open = stack[i];
    result += open === '{' ? '}' : ']';
  }

  return result;
}

export function formatZodErrors(error: {
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>;
}): string {
  return error.issues
    .map((issue) => `${issue.path.map(String).join('.') || 'root'}: ${issue.message}`)
    .join('; ');
}
