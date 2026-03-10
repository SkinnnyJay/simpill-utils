/** Shared constants for patterns.utils (literal audit). */
export const VALUE_0 = 0;
export const VALUE_1 = 1;
export const VALUE_2 = 2;
export const VALUE_3 = 3;
export const VALUE_4 = 4;
export const VALUE_5 = 5;
export const VALUE_6 = 6;
export const VALUE_8 = 8;
export const VALUE_10 = 10;
export const VALUE_11 = 11;
export const VALUE_42 = 42;
export const VALUE_80 = 80;

/** Strategy selector: unknown strategy key (append key). */
export const ERROR_STRATEGY_UNKNOWN_PREFIX = "Unknown strategy: " as const;
/** Chain: no handlers and no fallback. */
export const ERROR_CHAIN_NO_HANDLERS = "Chain has no handlers and no fallback." as const;
/** Chain: default when no handler handled the input. */
export const ERROR_CHAIN_NO_HANDLER_HANDLED = "No handler handled the input." as const;
/** State machine: no transition for event (append event). */
export const ERROR_STATE_MACHINE_NO_TRANSITION_PREFIX = "No transition for event: " as const;
/** Default mapError message for unknown error. */
export const ERROR_UNKNOWN_ERROR = "Unknown error" as const;
/** raceOk: default message when no result succeeded. */
export const ERROR_RACE_OK_NO_RESULT = "No successful result" as const;
/** raceOk: empty array. */
export const ERROR_RACE_OK_REQUIRES_ONE = "raceOk requires at least one result" as const;
