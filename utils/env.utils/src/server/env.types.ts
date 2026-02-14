/**
 * Types and interfaces for EnvManager and Env.
 */

export interface EnvLoggerAdapter {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export interface EnvManagerOptions {
  readonly envPath?: string;
  readonly envPaths?: readonly string[];
  readonly overload?: boolean;
  readonly overrides?: Readonly<Record<string, string>>;
  readonly extendProcessEnv?: boolean;
  readonly privateKey?: string;
  readonly keysPath?: string;
  readonly dynamic?: boolean;
  readonly logger?: EnvLoggerAdapter;
}

export interface IEnvManager {
  getString(key: string, defaultValue?: string): string;
  getNumber(key: string, defaultValue?: number): number;
  getBoolean(key: string, defaultValue?: boolean): boolean;
  getRequired(key: string, errorMessage?: string): string;
  getRequiredString(key: string, errorMessage?: string): string;
  getRequiredNumber(key: string, errorMessage?: string): number;
  getRequiredBoolean(key: string, errorMessage?: string): boolean;
  getEnum<T extends string>(
    key: string,
    allowed: readonly T[],
    defaultValue: T,
    options?: { caseInsensitive?: boolean },
  ): T;
  getRequiredEnum<T extends string>(
    key: string,
    allowed: readonly T[],
    options?: { caseInsensitive?: boolean },
  ): T;
  getStringStrict(key: string, errorMessage?: string): string;
  getNumberStrict(key: string, errorMessage?: string): number;
  getBooleanStrict(key: string, errorMessage?: string): boolean;
  getArray(key: string, defaultValue?: string[], separator?: string): string[];
  getJson<T = unknown>(key: string, defaultValue?: T): T;
  getRequiredJson<T = unknown>(key: string, errorMessage?: string): T;
  getValidatedString(
    key: string,
    validator: (value: string) => boolean | string,
    defaultValue?: string,
  ): string;
  getValidatedNumber(
    key: string,
    validator: (value: number) => boolean | string,
    defaultValue?: number,
  ): number;
  has(key: string): boolean;
  getValue(key: string): string | undefined;
  getValueOrDefault(key: string, defaultValue: string): string;
  getEnvironment(): string;
  getNodeEnv(): string;
  isProduction(): boolean;
  isDevelopment(): boolean;
  isTest(): boolean;
  isEncrypted(key: string): boolean;
  getDecrypted(key: string, privateKey?: string): string;
  parseEncrypted(encryptedValue: string, privateKey: string): string;
  getRawValue(key: string): string | undefined;
  getPrivateKey(): string | undefined;
  hasPrivateKey(): boolean;
  isDynamic(): boolean;
  refresh(): void;
  getCacheSize(): number;
}

export interface DotenvxConfigOutput {
  parsed?: Record<string, string>;
  error?: Error;
}

export interface DotenvxParseOutput {
  [key: string]: string;
}
