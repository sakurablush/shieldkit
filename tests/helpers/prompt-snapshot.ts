const MAX_LEN = 240;

export function snapshotPrompt(prompt: unknown): string {
  const text =
    typeof prompt === 'string'
      ? prompt
      : prompt === undefined
        ? ''
        : JSON.stringify(prompt);

  if (text.length <= MAX_LEN) {
    return text;
  }

  return `${text.slice(0, MAX_LEN)}…`;
}
