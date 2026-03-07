/**
 * Monolith smoke test: verify each @simpill utils package resolves (types + runtime).
 * Run: npm run test:smoke (or npx tsx index.ts). Requires: npm install at repo root first
 * so @simpill/* packages are installed from npm into node_modules; otherwise
 * imports will not resolve in the IDE and this script will throw MODULE_NOT_FOUND.
 */
import * as EnvClient from "@simpill/env.utils/client";
import * as EnvServer from "@simpill/env.utils/server";
import * as Adapters from "@simpill/adapters.utils";
import * as Algorithms from "@simpill/algorithms.utils";
import * as Annotations from "@simpill/annotations.utils";
import * as Api from "@simpill/api.utils";
import * as ArrayUtils from "@simpill/array.utils";
import * as Async from "@simpill/async.utils";
import * as Cache from "@simpill/cache.utils";
import * as Collections from "@simpill/collections.utils";
import * as Crypto from "@simpill/crypto.utils";
import * as Data from "@simpill/data.utils";
import * as Enum from "@simpill/enum.utils";
import * as Env from "@simpill/env.utils";
import * as Errors from "@simpill/errors.utils";
import * as Events from "@simpill/events.utils";
import * as Factories from "@simpill/factories.utils";
import * as File from "@simpill/file.utils";
import * as FunctionUtils from "@simpill/function.utils";
import * as Http from "@simpill/http.utils";
import * as Logger from "@simpill/logger.utils";
import * as Middleware from "@simpill/middleware.utils";
import * as Misc from "@simpill/misc.utils";
import * as Nextjs from "@simpill/nextjs.utils";
import * as NumberUtils from "@simpill/number.utils";
import * as ObjectUtils from "@simpill/object.utils";
import * as Observability from "@simpill/observability.utils";
import * as Patterns from "@simpill/patterns.utils";
import * as Protocols from "@simpill/protocols.utils";
import * as ReactUtils from "@simpill/react.utils";
import * as RequestContext from "@simpill/request-context.utils";
import * as Resilience from "@simpill/resilience.utils";
import * as Socket from "@simpill/socket.utils";
import * as StringUtils from "@simpill/string.utils";
import * as TestUtils from "@simpill/test.utils";
import * as Time from "@simpill/time.utils";
import * as TokenOptimizer from "@simpill/token-optimizer.utils";
import * as Uuid from "@simpill/uuid.utils";
import * as Zod from "@simpill/zod.utils";
import * as Zustand from "@simpill/zustand.utils";

export {
  EnvClient,
  EnvServer,
  Adapters,
  Algorithms,
  Annotations,
  Api,
  ArrayUtils,
  Async,
  Cache,
  Collections,
  Crypto,
  Data,
  Enum,
  Env,
  Errors,
  Events,
  Factories,
  File,
  FunctionUtils,
  Http,
  Logger,
  Middleware,
  Misc,
  Nextjs,
  NumberUtils,
  ObjectUtils,
  Observability,
  Patterns,
  Protocols,
  ReactUtils,
  RequestContext,
  Resilience,
  Socket,
  StringUtils,
  TestUtils,
  Time,
  TokenOptimizer,
  Uuid,
  Zod,
  Zustand,
}