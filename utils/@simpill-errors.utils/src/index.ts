/**
 * @simpill/errors.utils – Typed errors, codes, serialization, and RFC 9457 problem details.
 */

export type {
  AppErrorMeta,
  ErrorCode,
  ErrorCodeOptions,
  ProblemDetails,
  SerializedError,
} from "./shared";
export {
  AppError,
  createErrorCodeMap,
  createErrorFromCode,
  deserializeError,
  ERROR_CODES,
  errorCodeFromStatus,
  HTTP_STATUS_BY_CODE,
  httpStatusFromCode,
  isAppError,
  isError,
  isErrorLike,
  PROBLEM_JSON_CONTENT_TYPE,
  sanitizeForJson,
  serializeError,
  toProblemDetails,
} from "./shared";
