/**
 * @simpill/errors.utils – Typed errors, codes, and serialization.
 */

export type { AppErrorMeta, ErrorCode, ErrorCodeOptions, SerializedError } from "./shared";
export {
  AppError,
  createErrorCodeMap,
  ERROR_CODES,
  serializeError,
} from "./shared";
