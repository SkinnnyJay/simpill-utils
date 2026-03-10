import { type FormatOptions, type FormatValues, formatString } from "./format";

/**
 * String builder for efficient concatenation and formatting.
 */
export class StringBuilder {
  private parts: string[] = [];
  private lengthValue = 0;

  constructor(initial?: string | Iterable<string>) {
    if (typeof initial === "string") {
      this.append(initial);
    } else if (initial) {
      this.appendAll(initial);
    }
  }

  append(value: string): this {
    if (value.length === 0) {
      return this;
    }
    this.parts.push(value);
    this.lengthValue += value.length;
    return this;
  }

  appendAll(values: Iterable<string>): this {
    for (const value of values) {
      this.append(value);
    }
    return this;
  }

  appendLine(value = ""): this {
    return this.append(`${value}\n`);
  }

  appendFormat(template: string, values: FormatValues, options?: FormatOptions): this {
    return this.append(formatString(template, values, options));
  }

  prepend(value: string): this {
    if (value.length === 0) {
      return this;
    }
    this.parts.unshift(value);
    this.lengthValue += value.length;
    return this;
  }

  clear(): this {
    this.parts = [];
    this.lengthValue = 0;
    return this;
  }

  toString(): string {
    return this.parts.join("");
  }

  get length(): number {
    return this.lengthValue;
  }

  isEmpty(): boolean {
    return this.lengthValue === 0;
  }
}
