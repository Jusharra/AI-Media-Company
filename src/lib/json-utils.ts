/**
 * Robustly extract the first top-level JSON object from a string.
 * Tracks brace depth so it handles nested objects and ignores trailing content.
 * Falls back to stripping control characters if the first parse fails.
 */
export function extractJson<T = unknown>(text: string): T {
  // 1. Try code-fenced JSON block first  (```json ... ```)
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) {
    try { return JSON.parse(fenced[1]) as T; } catch { /* fall through */ }
  }

  // 2. Walk characters tracking brace depth to find first balanced object
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = text.slice(start, i + 1);
        try {
          return JSON.parse(candidate) as T;
        } catch {
          // Strip control characters and retry
          const cleaned = candidate.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
          try {
            return JSON.parse(cleaned) as T;
          } catch {
            // Keep looking for the next balanced object
            start = -1;
          }
        }
      }
    }
  }

  throw new Error('No valid JSON object found in model response');
}
