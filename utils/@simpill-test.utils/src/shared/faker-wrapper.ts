import { ERROR_FAKER_PICK_EMPTY, FAKE } from "./constants";

type FakerInstance = {
  seed?: (value: number) => void;
  string: { alphanumeric: (length: number) => string; uuid: () => string };
  number: { int: (opts: { min: number; max: number }) => number };
  datatype: { boolean: () => boolean };
  date: { between: (opts: { from: Date; to: Date }) => Date };
  helpers: { arrayElement: <T>(arr: T[]) => T };
};

type FakerModule = {
  faker?: FakerInstance;
  Faker?: new (opts: { locale: unknown[]; seed: number }) => FakerInstance;
  en?: unknown;
};

function getFakerInstance(seed: number): FakerInstance {
  const mod = require("@faker-js/faker") as FakerModule;
  if (mod.faker && typeof mod.faker.seed === "function") {
    mod.faker.seed(seed);
    return mod.faker;
  }
  if (typeof mod.Faker === "function") {
    try {
      return new mod.Faker({ locale: [mod.en ?? {}], seed });
    } catch {
      const fn = mod.Faker as unknown as (opts: {
        locale: unknown[];
        seed: number;
      }) => FakerInstance;
      return fn({ locale: [mod.en ?? {}], seed });
    }
  }
  throw new Error(
    "@faker-js/faker: could not resolve faker instance. Ensure @faker-js/faker is installed.",
  );
}

export interface FakerWrapperOptions {
  seed?: number;
}

export class FakerWrapper {
  private readonly faker: FakerInstance;

  constructor(options: FakerWrapperOptions = {}) {
    const seed = options.seed ?? FAKE.MIN_NUMBER + 1;
    this.faker = getFakerInstance(seed);
  }

  string(length: number = FAKE.STRING_LENGTH): string {
    return this.faker.string.alphanumeric(length);
  }

  number(min: number = FAKE.MIN_NUMBER, max: number = FAKE.MAX_NUMBER): number {
    return this.faker.number.int({ min, max });
  }

  boolean(): boolean {
    return this.faker.datatype.boolean();
  }

  email(localPart?: string): string {
    const local = localPart ?? this.faker.string.alphanumeric(8);
    return `${local}@${FAKE.EMAIL_DOMAIN}`;
  }

  uuid(): string {
    return this.faker.string.uuid();
  }

  date(from?: Date, to?: Date): Date {
    const fromDate = from ?? new Date(2000, 0, 1);
    const toDate = to ?? new Date(2030, 11, 31);
    return this.faker.date.between({ from: fromDate, to: toDate });
  }

  pick<T>(arr: ReadonlyArray<T>): T {
    if (arr.length === 0) {
      throw new Error(ERROR_FAKER_PICK_EMPTY);
    }
    return this.faker.helpers.arrayElement(arr as T[]);
  }
}

export function createFaker(options?: FakerWrapperOptions): FakerWrapper {
  return new FakerWrapper(options);
}
