/**
 * PressLine AI Content Sanitizer & Polisher
 * 
 * Ensures all AI-generated text is completely free of unwanted raw asterisks (*, **, ***),
 * converts markdown bullet asterisks (* item) into clean bullet characters (• item),
 * strips markdown heading hashtags (### Header), and preserves clean, publication-ready typography.
 */

export function cleanAiText(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  if (typeof raw !== 'string') {
    if (typeof raw === 'object') {
      try {
        return cleanAiObject(raw) as unknown as string;
      } catch {
        return String(raw);
      }
    }
    return String(raw);
  }

  // Preserve image data URIs or direct image URLs without modifying
  if (raw.startsWith('data:image/') || /^https?:\/\/.*\.(png|jpg|jpeg|webp|gif)/i.test(raw)) {
    return raw;
  }

  let text = raw;

  // 1. Remove markdown bold/italic asterisks: ***text*** -> text, **text** -> text, *text* -> text
  // Handle 3 asterisks
  text = text.replace(/\*{3}([^\*]+?)\*{3}/g, '$1');
  // Handle 2 asterisks (bold)
  text = text.replace(/\*{2}([^\*]+?)\*{2}/g, '$1');
  // Handle 1 asterisk around words (italic)
  text = text.replace(/(^|[^\w\*])\*([^\*\n]+?)\*([^\w\*]|$)/g, '$1$2$3');

  // 2. Convert asterisk or dash bullets at beginning of lines into clean round bullets (•)
  text = text.replace(/^[ \t]*\*+[ \t]+/gm, '• ');
  text = text.replace(/^[ \t]*-+[ \t]+/gm, '• ');

  // 3. Remove markdown headers (e.g. ## Section Title -> Section Title)
  text = text.replace(/^[ \t]*#{1,6}[ \t]+/gm, '');

  // 4. Remove any remaining isolated asterisks
  text = text.replace(/(?<!\d)\*(?!\d)/g, '');

  // 5. Clean markdown code block fences if wrapping text
  text = text.replace(/^```[a-zA-Z0-9_-]*\n?/gm, '').replace(/\n?```$/gm, '');

  // 6. Clean multiple blank lines into clean paragraph spacing
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Recursively cleans all strings inside an object or array returned by AI
 */
export function cleanAiOutput<T>(input: T): T {
  if (input === null || input === undefined) return input;

  if (typeof input === 'string') {
    return cleanAiText(input) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => cleanAiOutput(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      result[key] = cleanAiOutput(value);
    }
    return result as unknown as T;
  }

  return input;
}

export function cleanAiObject(obj: unknown): unknown {
  return cleanAiOutput(obj);
}
