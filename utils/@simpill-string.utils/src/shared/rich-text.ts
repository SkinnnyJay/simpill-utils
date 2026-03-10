import { escapeHtml } from "./string.utils";

export type RichColor =
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
  | "gray";

export type RichStyle = {
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: RichColor;
  background?: RichColor;
};

export type RichFormat = "ansi" | "html" | "plain";

const ANSI_RESET = "\u001b[0m";

const ANSI_COLORS: Record<RichColor, string> = {
  black: "30",
  red: "31",
  green: "32",
  yellow: "33",
  blue: "34",
  magenta: "35",
  cyan: "36",
  white: "37",
  gray: "90",
};

const ANSI_BACKGROUND_COLORS: Record<RichColor, string> = {
  black: "40",
  red: "41",
  green: "42",
  yellow: "43",
  blue: "44",
  magenta: "45",
  cyan: "46",
  white: "47",
  gray: "100",
};

function applyAnsiStyle(text: string, style?: RichStyle): string {
  if (!style) {
    return text;
  }

  const codes: string[] = [];
  if (style.bold) {
    codes.push("1");
  }
  if (style.dim) {
    codes.push("2");
  }
  if (style.italic) {
    codes.push("3");
  }
  if (style.underline) {
    codes.push("4");
  }
  if (style.color) {
    codes.push(ANSI_COLORS[style.color]);
  }
  if (style.background) {
    codes.push(ANSI_BACKGROUND_COLORS[style.background]);
  }

  if (codes.length === 0) {
    return text;
  }

  return `\u001b[${codes.join(";")}m${text}${ANSI_RESET}`;
}

function applyHtmlStyle(text: string, style?: RichStyle): string {
  const escaped = escapeHtml(text);
  if (!style) {
    return escaped;
  }

  const declarations: string[] = [];
  if (style.color) {
    declarations.push(`color:${style.color}`);
  }
  if (style.background) {
    declarations.push(`background-color:${style.background}`);
  }
  if (style.bold) {
    declarations.push("font-weight:700");
  }
  if (style.italic) {
    declarations.push("font-style:italic");
  }
  if (style.underline) {
    declarations.push("text-decoration:underline");
  }
  if (style.dim) {
    declarations.push("opacity:0.7");
  }

  if (declarations.length === 0) {
    return escaped;
  }

  return `<span style="${declarations.join(";")}">${escaped}</span>`;
}

export function formatRichText(
  text: string,
  style?: RichStyle,
  format: RichFormat = "ansi",
): string {
  if (format === "plain") {
    return text;
  }
  if (format === "html") {
    return applyHtmlStyle(text, style);
  }
  return applyAnsiStyle(text, style);
}

type RichSegment = { text: string; style?: RichStyle };

export class RichTextBuilder {
  private segments: RichSegment[] = [];
  private lengthValue = 0;

  append(text: string, style?: RichStyle): this {
    if (text.length === 0) {
      return this;
    }
    this.segments.push({ text, style });
    this.lengthValue += text.length;
    return this;
  }

  appendLine(text = "", style?: RichStyle): this {
    return this.append(`${text}\n`, style);
  }

  clear(): this {
    this.segments = [];
    this.lengthValue = 0;
    return this;
  }

  toPlain(): string {
    return this.segments.map((segment) => segment.text).join("");
  }

  toAnsi(): string {
    return this.segments
      .map((segment) => formatRichText(segment.text, segment.style, "ansi"))
      .join("");
  }

  toHtml(): string {
    return this.segments
      .map((segment) => formatRichText(segment.text, segment.style, "html"))
      .join("");
  }

  toString(): string {
    return this.toAnsi();
  }

  get length(): number {
    return this.lengthValue;
  }

  isEmpty(): boolean {
    return this.lengthValue === 0;
  }
}
