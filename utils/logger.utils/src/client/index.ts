/**
 * @file Client Exports
 * @description Edge Runtime and browser-compatible logger utilities
 */

export {
  createEdgeLogger,
  disableEdgeMockLogger,
  EdgeLogger,
  EdgeLogInstance,
  edgeLogDebug,
  edgeLogError,
  edgeLogInfo,
  edgeLogWarn,
  enableEdgeMockLogger,
  isEdgeMockLoggerActive,
} from "./logger.edge";
