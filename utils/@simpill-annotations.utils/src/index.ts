/**
 * @simpill/annotations.utils – Metadata store and annotation helpers.
 */
export type {
  AnnotationStore,
  DecoratorMetadataObject,
  MetadataKey,
  MetadataStore,
  TypedMetadataKey,
} from "./shared";
export {
  clearAnnotations,
  createAnnotationStore,
  createMetadataKey,
  createMetadataStore,
  deleteAnnotation,
  ensureSymbolMetadata,
  getAnnotation,
  getAnnotationKeys,
  getAnnotations,
  getDecoratorMetadata,
  getInheritedAnnotation,
  getMetadata,
  globalMetadataStore,
  hasAnnotation,
  hasInheritedAnnotation,
  metadataStoreFromDecorator,
  readDecoratorMetadata,
  setAnnotation,
  setMetadata,
  symbolMetadata,
} from "./shared";
