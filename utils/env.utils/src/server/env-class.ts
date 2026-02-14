import type { EnvManagerOptions } from "./env.types";
import { EnvManager } from "./env-manager";

/** Shorthand static API that delegates to EnvManager.getInstance(). */
export class Env {
  static getString(key: string, defaultValue = ""): string {
    return EnvManager.getInstance().getString(key, defaultValue);
  }

  static getNumber(key: string, defaultValue = 0): number {
    return EnvManager.getInstance().getNumber(key, defaultValue);
  }

  static getBoolean(key: string, defaultValue = false): boolean {
    return EnvManager.getInstance().getBoolean(key, defaultValue);
  }

  static getRequired(key: string, errorMessage?: string): string {
    return EnvManager.getInstance().getRequired(key, errorMessage);
  }

  static getRequiredString(key: string, errorMessage?: string): string {
    return EnvManager.getInstance().getRequiredString(key, errorMessage);
  }

  static getRequiredNumber(key: string, errorMessage?: string): number {
    return EnvManager.getInstance().getRequiredNumber(key, errorMessage);
  }

  static getRequiredBoolean(key: string, errorMessage?: string): boolean {
    return EnvManager.getInstance().getRequiredBoolean(key, errorMessage);
  }

  static getEnum<T extends string>(
    key: string,
    allowed: readonly T[],
    defaultValue: T,
    options?: { caseInsensitive?: boolean },
  ): T {
    return EnvManager.getInstance().getEnum(key, allowed, defaultValue, options);
  }

  static getRequiredEnum<T extends string>(
    key: string,
    allowed: readonly T[],
    options?: { caseInsensitive?: boolean },
  ): T {
    return EnvManager.getInstance().getRequiredEnum(key, allowed, options);
  }

  static getStringStrict(key: string, errorMessage?: string): string {
    return EnvManager.getInstance().getStringStrict(key, errorMessage);
  }

  static getNumberStrict(key: string, errorMessage?: string): number {
    return EnvManager.getInstance().getNumberStrict(key, errorMessage);
  }

  static getBooleanStrict(key: string, errorMessage?: string): boolean {
    return EnvManager.getInstance().getBooleanStrict(key, errorMessage);
  }

  static getArray(key: string, defaultValue: string[] = [], separator = ","): string[] {
    return EnvManager.getInstance().getArray(key, defaultValue, separator);
  }

  static getJson<T = unknown>(key: string, defaultValue?: T): T {
    return EnvManager.getInstance().getJson(key, defaultValue);
  }

  static getRequiredJson<T = unknown>(key: string, errorMessage?: string): T {
    return EnvManager.getInstance().getRequiredJson(key, errorMessage);
  }

  static getValidatedString(
    key: string,
    validator: (value: string) => boolean | string,
    defaultValue = "",
  ): string {
    return EnvManager.getInstance().getValidatedString(key, validator, defaultValue);
  }

  static getValidatedNumber(
    key: string,
    validator: (value: number) => boolean | string,
    defaultValue = 0,
  ): number {
    return EnvManager.getInstance().getValidatedNumber(key, validator, defaultValue);
  }

  static has(key: string): boolean {
    return EnvManager.getInstance().has(key);
  }

  static getValue(key: string): string | undefined {
    return EnvManager.getInstance().getValue(key);
  }

  static getValueOrDefault(key: string, defaultValue: string): string {
    return EnvManager.getInstance().getValueOrDefault(key, defaultValue);
  }

  static isProduction(): boolean {
    return EnvManager.getInstance().isProduction();
  }

  static isDevelopment(): boolean {
    return EnvManager.getInstance().isDevelopment();
  }

  static isTest(): boolean {
    return EnvManager.getInstance().isTest();
  }

  static getNodeEnv(): string {
    return EnvManager.getInstance().getNodeEnv();
  }

  static isEncrypted(key: string): boolean {
    return EnvManager.getInstance().isEncrypted(key);
  }

  static getDecrypted(key: string, privateKey?: string): string {
    return EnvManager.getInstance().getDecrypted(key, privateKey);
  }

  static hasPrivateKey(): boolean {
    return EnvManager.getInstance().hasPrivateKey();
  }

  static isDynamic(): boolean {
    return EnvManager.getInstance().isDynamic();
  }

  static refresh(): void {
    EnvManager.getInstance().refresh();
  }

  static getCacheSize(): number {
    return EnvManager.getInstance().getCacheSize();
  }

  static bootstrap(options?: EnvManagerOptions | readonly string[]): void {
    EnvManager.bootstrap(options);
  }

  static reset(): void {
    EnvManager.resetInstance();
  }
}
