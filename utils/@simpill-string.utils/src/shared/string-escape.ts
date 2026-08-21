/**
 * String escape/unescape and line splitting.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const HTML_UNESCAPE_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

export function unescapeHtml(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|#39);/g, (match) => {
    return HTML_UNESCAPE_MAP[match] ?? match;
  });
}

/**
 * Match ANSI escape sequences per ECMA-48. Two alternatives:
 *   - OSC: ESC ] ... terminated by BEL (0x07), ST (ESC \) or C1 ST (0x9C).
 *          Covers OSC-8 terminal hyperlinks, window-title sequences, etc.
 *   - CSI: ESC [ (or C1 0x9B), parameter bytes 0x30-0x3F, intermediate bytes
 *          0x20-0x2F, final byte 0x40-0x7E. Covers SGR colors, cursor movement,
 *          screen/line erase, and colon-separated RGB parameters.
 * The pattern is assembled from a string of regex-source escapes (not a regex
 * literal) so the source file contains no raw control characters. The original
 * implementation matched only SGR ("...m") codes and left hyperlinks, cursor
 * and erase sequences in the output.
 */
const ANSI_PATTERN =
  "[\\u001B\\u009B]\\][\\s\\S]*?(?:\\u0007|\\u001B\\\\|\\u009C)" +
  "|[\\u001B\\u009B]\\[[\\u0030-\\u003F]*[\\u0020-\\u002F]*[\\u0040-\\u007E]";
const ANSI_REGEX = new RegExp(ANSI_PATTERN, "g");

export function stripAnsi(value: string): string {
  return value.replace(ANSI_REGEX, "");
}

export function splitLines(value: string): string[] {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}
