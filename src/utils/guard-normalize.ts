/**
 * Normalize prompt text before injection/keyword guards.
 * PII guards intentionally do not use this — international formats must stay literal.
 */
const ZERO_WIDTH_CHARS = /[\u200B-\u200D\uFEFF\u00AD]/g;

/** Cyrillic letters that visually match Latin (common prompt-injection evasion). */
const CYRILLIC_TO_LATIN: Readonly<Record<string, string>> = {
  '\u0430': 'a',
  '\u0435': 'e',
  '\u043E': 'o',
  '\u043F': 'p',
  '\u0440': 'p',
  '\u0441': 'c',
  '\u0443': 'y',
  '\u0445': 'x',
  '\u0456': 'i',
  '\u0410': 'A',
  '\u0415': 'E',
  '\u041E': 'O',
  '\u0420': 'P',
  '\u0421': 'C',
  '\u0423': 'Y',
  '\u0425': 'X',
};

export function normalizeGuardText(text: string): string {
  const withoutZeroWidth = text.replace(ZERO_WIDTH_CHARS, '');
  const nfkc = withoutZeroWidth.normalize('NFKC');

  let result = '';
  for (const char of nfkc) {
    result += CYRILLIC_TO_LATIN[char] ?? char;
  }
  return result;
}
