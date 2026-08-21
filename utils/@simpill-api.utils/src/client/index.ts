/**
 * Client entry for @simpill/api.utils.
 * The API factory (createApiFactory, typed fetch client, handler registry) is
 * server-only; import from "@simpill/api.utils" or "@simpill/api.utils/server".
 *
 * v1 exported an empty object, which crashed isomorphic modules that import
 * shared types or error classes through this entry (same class of bug as the
 * request-context and misc barrel-parity fixes). This entry now re-exports the
 * full Edge-safe shared surface: types plus the error classes (pure, zero-dep,
 * no Node APIs) so `err instanceof ApiHttpError` works in client bundles.
 */

export type {
  ApiClient,
  ApiHandler,
  ApiMiddleware,
  ApiRouteDef,
  ApiRoutesShape,
  ApiSchema,
  ApiSchemaLike,
  ClientCallOptionsFor,
  ClientResult,
  HandlerRequest,
  HttpMethod,
  InferInput,
  InferOutput,
  RetryOptions,
  RouteKey,
  RouteTypeShape,
  TypedClient,
  TypedClientMethod,
  TypedHandler,
  TypedHandlers,
  TypedRequestContext,
} from "../shared";
export {
  ApiDuplicateRouteError,
  ApiHttpError,
  ApiMissingParamError,
  ApiResponseParseError,
  ApiTimeoutError,
  GET,
} from "../shared";
