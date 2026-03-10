import { ERROR_CHAIN_NO_HANDLER_HANDLED, ERROR_CHAIN_NO_HANDLERS, VALUE_0 } from "./constants";

/** Result of a chain handler: either handled with a value or not handled. */
export type ChainResult<O> = { handled: true; value: O } | { handled: false };

/** Create a chain result indicating the handler produced a value. */
export function handled<O>(value: O): ChainResult<O> {
  return { handled: true, value };
}

/** Create a chain result indicating the handler did not handle the input. */
export function unhandled(): ChainResult<never> {
  return { handled: false };
}

/** Handler that accepts input and returns ChainResult<O>. */
export type ChainHandler<I, O> = (input: I) => ChainResult<O>;

/** Options for the chain: optional fallback and custom error message. */
export type ChainOptions<I, O> = {
  fallback?: (input: I) => O;
  errorMessage?: (input: I) => string;
};

/** Run handlers in order until one returns handled; optional fallback or throws. */
export function chainOfResponsibility<I, O>(
  handlers: Array<ChainHandler<I, O>>,
  options?: ChainOptions<I, O>
): (input: I) => O {
  if (handlers.length === VALUE_0 && !options?.fallback) {
    throw new Error(ERROR_CHAIN_NO_HANDLERS);
  }

  return (input: I): O => {
    for (const handler of handlers) {
      const result = handler(input);
      if (result.handled) {
        return result.value;
      }
    }

    if (options?.fallback) {
      return options.fallback(input);
    }

    const message = options?.errorMessage?.(input) ?? ERROR_CHAIN_NO_HANDLER_HANDLED;
    throw new Error(message);
  };
}
