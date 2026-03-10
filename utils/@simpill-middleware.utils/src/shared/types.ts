export type Next = () => void | Promise<void>;

export interface MiddlewareRequest {
  headers?: Record<string, string | string[] | undefined>;
  [key: string]: unknown;
}

export interface MiddlewareResponse {
  setHeader?(name: string, value: string): void;
  [key: string]: unknown;
}

export type Middleware<Req = MiddlewareRequest, Res = MiddlewareResponse> = (
  req: Req,
  res: Res,
  next: Next,
) => void | Promise<void>;
