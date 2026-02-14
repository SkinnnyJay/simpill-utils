import dotenvx from "@dotenvx/dotenvx";
import {
  DOTENVX_INTERNAL,
  ENCRYPTED_VALUE_PREFIX,
  ENV_ERROR_MESSAGE,
} from "../shared/constants";
import { EnvDecryptError } from "../shared/errors";
import type { DotenvxParseOutput } from "./env.types";

/**
 * Parse and decrypt an encrypted value string.
 * @throws {EnvDecryptError} If decryption fails or value is not encrypted
 */
export function parseEncrypted(encryptedValue: string, privateKey: string): string {
  if (!encryptedValue.startsWith(ENCRYPTED_VALUE_PREFIX)) {
    throw new EnvDecryptError(DOTENVX_INTERNAL.INLINE_KEY, ENV_ERROR_MESSAGE.NOT_ENCRYPTED);
  }

  try {
    const envString = `${DOTENVX_INTERNAL.TEMP_DECRYPT_KEY}=${encryptedValue}`;
    const result: DotenvxParseOutput = dotenvx.parse(envString, { privateKey });
    const decryptedValue = result[DOTENVX_INTERNAL.TEMP_DECRYPT_KEY];

    if (decryptedValue?.startsWith(ENCRYPTED_VALUE_PREFIX)) {
      throw new EnvDecryptError(DOTENVX_INTERNAL.INLINE_KEY, ENV_ERROR_MESSAGE.DECRYPTION_FAILED);
    }

    return decryptedValue ?? "";
  } catch (error) {
    if (error instanceof EnvDecryptError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new EnvDecryptError(DOTENVX_INTERNAL.INLINE_KEY, message);
  }
}
