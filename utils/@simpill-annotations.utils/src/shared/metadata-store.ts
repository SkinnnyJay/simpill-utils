/**
 * annotations.utils metadata store is now a re-export facade.
 * The canonical implementation lives in @simpill/function.utils.
 * This file is preserved so existing imports of
 * "@simpill/annotations.utils" and relative source paths continue to work.
 */
export {
  createMetadataStore,
  getMetadata,
  globalMetadataStore,
  type MetadataKey,
  type MetadataStore,
  setMetadata,
} from "@simpill/function.utils/shared";
