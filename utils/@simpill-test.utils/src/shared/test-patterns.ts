export type FixtureFactory<T> = (overrides?: Partial<T>) => T;

export class TestPatterns {
  private teardownFns: Array<() => void | Promise<void>> = [];

  addTeardown(fn: () => void | Promise<void>): void {
    this.teardownFns.push(fn);
  }

  async runTeardown(): Promise<void> {
    const fns = [...this.teardownFns];
    this.teardownFns = [];
    for (const fn of fns) {
      await fn();
    }
  }

  createFixture<T extends object>(base: T): FixtureFactory<T> {
    return (overrides?: Partial<T>): T => {
      return overrides ? { ...base, ...overrides } : { ...base };
    };
  }

  createDouble<TArgs extends unknown[], TReturn>(
    defaultReturn: TReturn,
  ): {
    fn: (...args: TArgs) => TReturn;
    calls: TArgs[];
    reset: () => void;
  } {
    const calls: TArgs[] = [];
    const fn = (...args: TArgs): TReturn => {
      calls.push(args);
      return defaultReturn;
    };
    const reset = (): void => {
      calls.length = 0;
    };
    return { fn, calls, reset };
  }

  createAsyncDouble<TArgs extends unknown[], TReturn>(
    resolvedValue: TReturn,
  ): {
    fn: (...args: TArgs) => Promise<TReturn>;
    calls: TArgs[];
    reset: () => void;
  } {
    const calls: TArgs[] = [];
    const fn = async (...args: TArgs): Promise<TReturn> => {
      calls.push(args);
      return resolvedValue;
    };
    const reset = (): void => {
      calls.length = 0;
    };
    return { fn, calls, reset };
  }
}

export function createTestPatterns(): TestPatterns {
  return new TestPatterns();
}
