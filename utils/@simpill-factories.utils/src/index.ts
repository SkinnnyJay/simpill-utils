/**
 * @simpill/factories.utils – Typed factory, singleton factory, error factory.
 */
export type {
  BuildContext,
  ErrorConstructor,
  ErrorFactoryOptions,
  ErrorFactorySettings,
  FactoryFn,
  ListOverrides,
} from "./shared";
export {
  createFactory,
  errorFactory,
  resetSingletonFactory,
  singletonAsyncFactory,
  singletonFactory,
} from "./shared";
