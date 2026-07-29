import dotenvx from "@dotenvx/dotenvx";
import { DEFAULT_ENV_PATHS, ENV_KEY, LOG_PREFIX, NODE_ENV } from "../shared/constants";
import type {
  DotenvxConfigOutput,
  EnvLoggerAdapter,
  EnvManagerOptions,
  IEnvManager,
} from "./env.types";
import { parseEncrypted } from "./env-encrypt";
import {
  getArrayFromEnv,
  getBooleanFromEnv,
  getDecryptedFromEnv,
  getEnumFromEnv,
  getJsonFromEnv,
  getNumberFromEnv,
  getRequiredBooleanFromEnv,
  getRequiredEnumFromEnv,
  getRequiredJsonFromEnv,
  getRequiredNumberFromEnv,
  getRequiredStringFromEnv,
  getStringFromEnv,
  getValidatedNumberFromEnv,
  getValidatedStringFromEnv,
  isEncryptedFromEnv,
} from "./env-getters";
import { applyOverrides, loadEnvFiles, snapshotProcessEnv } from "./env-load";

export type { EnvLoggerAdapter, EnvManagerOptions, IEnvManager };

export class EnvManager implements IEnvManager {
  private static instance: EnvManager | null = null;
  private static bootstrapped = false;
  private static logger: EnvLoggerAdapter | null = null;

  private readonly envCache: Map<string, string>;
  readonly rawCache: Map<string, string>;
  private readonly privateKey: string | undefined;
  private readonly dynamic: boolean;
  private readonly options: EnvManagerOptions | undefined;

  private constructor(options?: EnvManagerOptions) {
    this.envCache = new Map();
    this.rawCache = new Map();
    this.privateKey = options?.privateKey ?? process.env[ENV_KEY.DOTENV_PRIVATE_KEY];
    this.dynamic = options?.dynamic ?? false;
    this.options = options;
    loadEnvFiles(this.envCache, this.rawCache, options);
    snapshotProcessEnv(this.envCache, this.rawCache);
    applyOverrides(this.envCache, this.rawCache, options?.overrides);
  }

  private static defaultLog(_level: "info" | "warn" | "error", message: string): void {
    process.stderr.write(`${LOG_PREFIX.ENV_MANAGER} ${message}\n`);
  }

  private static log(
    level: "info" | "warn" | "error",
    message: string,
    meta?: Record<string, unknown>
  ): void {
    if (EnvManager.logger) {
      EnvManager.logger[level](message, meta);
    } else {
      EnvManager.defaultLog(level, message);
    }
  }

  public static setLogger(logger: EnvLoggerAdapter | null): void {
    EnvManager.logger = logger;
  }

  public static getLogger(): EnvLoggerAdapter | null {
    return EnvManager.logger;
  }

  public static bootstrap(options?: EnvManagerOptions | readonly string[]): void {
    if (EnvManager.bootstrapped) {
      return;
    }
    const config: EnvManagerOptions = Array.isArray(options)
      ? { envPaths: options }
      : ((options as EnvManagerOptions | undefined) ?? {});

    if (config.logger) {
      EnvManager.logger = config.logger;
    }

    const paths = config.envPaths ?? (config.envPath ? [config.envPath] : DEFAULT_ENV_PATHS);
    const overload = config.overload ?? false;

    for (const envPath of paths) {
      const result: DotenvxConfigOutput = dotenvx.config({
        path: envPath,
        quiet: true,
        overload,
      });
      if (result.parsed && Object.keys(result.parsed).length > 0) {
        EnvManager.log("info", `Loaded: ${envPath}`, {
          path: envPath,
          count: Object.keys(result.parsed).length,
        });
      }
    }

    if (config.overrides) {
      for (const [key, value] of Object.entries(config.overrides)) {
        process.env[key] = value;
      }
    }

    if (config.extendProcessEnv !== false) {
      EnvManager.extendProcessEnvPrototype();
    }

    EnvManager.bootstrapped = true;
  }

  public static isBootstrapped(): boolean {
    return EnvManager.bootstrapped;
  }

  public static resetBootstrap(): void {
    EnvManager.bootstrapped = false;
  }

  public static getInstance(options?: EnvManagerOptions): EnvManager {
    if (EnvManager.instance) {
      // Silent-footgun guard: options passed after the singleton exists
      // were dropped without a trace, so callers got a manager configured
      // by whoever ran first. Warn loudly instead of losing the config.
      if (options !== undefined) {
        EnvManager.log(
          "warn",
          "getInstance(options) called after the instance was created — options ignored. Call resetInstance() first or configure at first use.",
          { ignoredOptions: Object.keys(options) }
        );
      }
      return EnvManager.instance;
    }
    EnvManager.instance = new EnvManager(options);
    return EnvManager.instance;
  }

  public static resetInstance(): void {
    EnvManager.instance = null;
  }

  /**
   * @deprecated Use Env class instead
   *
   * Implementation note: the previous `Object.assign(process.env, {...fns})`
   * was broken in real Node — `process.env`'s setter coerces every assigned
   * value to a string, so the "methods" were stored as source-code TEXT and
   * `process.env.getString(...)` threw `TypeError: not a function`. The old
   * tests only passed because they replaced process.env with a plain object
   * (`process.env = { ...originalEnv }`), which jest-style setups do too.
   * Installing the helpers on a dedicated prototype sidesteps the setter,
   * works on the REAL process.env, and keeps them out of enumeration
   * (Object.keys/entries and child-process env inheritance stay clean).
   */
  public static extendProcessEnvPrototype(): void {
    Object.setPrototypeOf(process.env, EnvManager.buildProcessEnvHelperPrototype());
  }

  /** @internal Restore the default prototype (used by tests/teardown). */
  public static unextendProcessEnvPrototype(): void {
    Object.setPrototypeOf(process.env, Object.prototype);
  }

  private static buildProcessEnvHelperPrototype(): object {
    return Object.assign(Object.create(Object.prototype), {
      getString: (key: string, defaultValue = "") =>
        EnvManager.getInstance().getString(key, defaultValue),
      getNumber: (key: string, defaultValue = 0) =>
        EnvManager.getInstance().getNumber(key, defaultValue),
      getBoolean: (key: string, defaultValue = false) =>
        EnvManager.getInstance().getBoolean(key, defaultValue),
      getRequired: (key: string, errorMessage?: string) =>
        EnvManager.getInstance().getRequired(key, errorMessage),
      getRequiredString: (key: string, errorMessage?: string) =>
        EnvManager.getInstance().getRequiredString(key, errorMessage),
      getRequiredNumber: (key: string, errorMessage?: string) =>
        EnvManager.getInstance().getRequiredNumber(key, errorMessage),
      getRequiredBoolean: (key: string, errorMessage?: string) =>
        EnvManager.getInstance().getRequiredBoolean(key, errorMessage),
      has: (key: string) => EnvManager.getInstance().has(key),
      isEncrypted: (key: string) => EnvManager.getInstance().isEncrypted(key),
      getDecrypted: (key: string, privateKey?: string) =>
        EnvManager.getInstance().getDecrypted(key, privateKey),
    });
  }

  public getEnvironment(): string {
    return this.getValue(ENV_KEY.NODE_ENV) ?? NODE_ENV.DEVELOPMENT;
  }

  public isProduction(): boolean {
    return this.getEnvironment() === NODE_ENV.PRODUCTION;
  }

  public isDevelopment(): boolean {
    return this.getEnvironment() === NODE_ENV.DEVELOPMENT;
  }

  public isTest(): boolean {
    return this.getEnvironment() === NODE_ENV.TEST;
  }

  public getNodeEnv(): string {
    return this.getEnvironment();
  }

  public isDynamic(): boolean {
    return this.dynamic;
  }

  public refresh(): void {
    this.envCache.clear();
    this.rawCache.clear();
    loadEnvFiles(this.envCache, this.rawCache, this.options);
    snapshotProcessEnv(this.envCache, this.rawCache);
    applyOverrides(this.envCache, this.rawCache, this.options?.overrides);
  }

  public getCacheSize(): number {
    return this.envCache.size;
  }

  public has(key: string): boolean {
    if (this.dynamic) {
      return process.env[key] !== undefined;
    }
    return this.envCache.has(key);
  }

  public getValue(key: string): string | undefined {
    if (this.dynamic) {
      return process.env[key];
    }
    return this.envCache.get(key);
  }

  public getValueOrDefault(key: string, defaultValue: string): string {
    return this.getValue(key) ?? defaultValue;
  }

  public getString(key: string, defaultValue = ""): string {
    return getStringFromEnv(this.getValue.bind(this), key, defaultValue);
  }

  public getRequired(key: string, errorMessage?: string): string {
    return getRequiredStringFromEnv(this.getValue.bind(this), key, errorMessage);
  }

  public getRequiredString(key: string, errorMessage?: string): string {
    return this.getRequired(key, errorMessage);
  }

  public getStringStrict(key: string, errorMessage?: string): string {
    return this.getRequired(key, errorMessage);
  }

  public getNumber(key: string, defaultValue = 0): number {
    return getNumberFromEnv(this.getValue.bind(this), key, defaultValue);
  }

  public getNumberStrict(key: string, errorMessage?: string): number {
    return getRequiredNumberFromEnv(this.getValue.bind(this), key, errorMessage);
  }

  public getRequiredNumber(key: string, errorMessage?: string): number {
    return this.getNumberStrict(key, errorMessage);
  }

  public getBoolean(key: string, defaultValue = false): boolean {
    return getBooleanFromEnv(this.getValue.bind(this), key, defaultValue);
  }

  public getBooleanStrict(key: string, errorMessage?: string): boolean {
    return getRequiredBooleanFromEnv(this.getValue.bind(this), key, errorMessage);
  }

  public getRequiredBoolean(key: string, errorMessage?: string): boolean {
    return this.getBooleanStrict(key, errorMessage);
  }

  public getEnum<T extends string>(
    key: string,
    allowed: readonly T[],
    defaultValue: T,
    options?: { caseInsensitive?: boolean }
  ): T {
    return getEnumFromEnv(this.getValue.bind(this), key, allowed, defaultValue, options);
  }

  public getRequiredEnum<T extends string>(
    key: string,
    allowed: readonly T[],
    options?: { caseInsensitive?: boolean }
  ): T {
    return getRequiredEnumFromEnv(this.getValue.bind(this), key, allowed, options);
  }

  public getArray(key: string, defaultValue: string[] = [], separator = ","): string[] {
    return getArrayFromEnv(this.getValue.bind(this), key, defaultValue, separator);
  }

  public getJson<T = unknown>(key: string, defaultValue?: T, validate?: (value: unknown) => T): T {
    return getJsonFromEnv(this.getValue.bind(this), key, defaultValue, validate);
  }

  public getRequiredJson<T = unknown>(
    key: string,
    errorMessage?: string,
    validate?: (value: unknown) => T
  ): T {
    return getRequiredJsonFromEnv(this.getValue.bind(this), key, errorMessage, validate);
  }

  public getValidatedString(
    key: string,
    validator: (value: string) => boolean | string,
    defaultValue = ""
  ): string {
    return getValidatedStringFromEnv(
      this.getValue.bind(this),
      this.getString.bind(this),
      key,
      validator,
      defaultValue
    );
  }

  public getValidatedNumber(
    key: string,
    validator: (value: number) => boolean | string,
    defaultValue = 0
  ): number {
    return getValidatedNumberFromEnv(this.getNumber.bind(this), key, validator, defaultValue);
  }

  public isEncrypted(key: string): boolean {
    return isEncryptedFromEnv(this.rawCache, key);
  }

  public getRawValue(key: string): string | undefined {
    return this.rawCache.get(key);
  }

  public getDecrypted(key: string, privateKey?: string): string {
    return getDecryptedFromEnv(
      {
        getValue: this.getValue.bind(this),
        getRawValue: this.getRawValue.bind(this),
        envCache: this.envCache,
        rawCache: this.rawCache,
        privateKey: this.privateKey,
      },
      key,
      privateKey
    );
  }

  public parseEncrypted(encryptedValue: string, privateKey: string): string {
    return parseEncrypted(encryptedValue, privateKey);
  }

  /**
   * @deprecated This method exposes sensitive key material and will be removed in a future
   * major version. Use `hasPrivateKey()` to check if a key is loaded without exposing it.
   */
  public getPrivateKey(): string | undefined {
    return this.privateKey;
  }

  public hasPrivateKey(): boolean {
    return this.privateKey !== undefined && this.privateKey.length > 0;
  }
}
