import { type FormatOptions, type FormatValues, formatString } from "./format";

export class StringTemplate {
  private template: string;
  private options?: FormatOptions;

  constructor(template: string, options?: FormatOptions) {
    this.template = template;
    this.options = options;
  }

  format(values: FormatValues, options?: FormatOptions): string {
    const merged: FormatOptions = {
      ...(this.options ?? {}),
      ...(options ?? {}),
    };
    return formatString(this.template, values, merged);
  }

  toString(): string {
    return this.template;
  }

  get value(): string {
    return this.template;
  }
}
