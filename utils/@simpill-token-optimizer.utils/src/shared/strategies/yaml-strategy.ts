import { dump, load } from "js-yaml";

import { ERROR_MESSAGES, INDENT_SPACES } from "../constants";
import type { OptimizationRequest } from "../token-optimizer.types";
import {
  type YamlOptimizationPayload,
  yamlOptimizationPayloadSchema,
} from "../token-optimizer.types";
import { CompressionTypeEnum } from "../types";
import type { CompressionOutcome, CompressionStrategy } from "./base";

const YAML_DUMP_OPTIONS = {
  noRefs: true,
  noCompatMode: true,
  sortKeys: true,
  indent: INDENT_SPACES,
  lineWidth: 80,
};

const collectYamlStats = (value: unknown, normalized: string): YamlOptimizationPayload => {
  let keyCount = 0;
  let sequenceCount = 0;
  let scalarCount = 0;

  const visit = (node: unknown): void => {
    if (node === null || node === undefined) {
      return;
    }

    if (Array.isArray(node)) {
      sequenceCount += 1;
      for (const item of node) {
        visit(item);
      }
      return;
    }

    if (typeof node === "object") {
      const entries = Object.entries(node as Record<string, unknown>);
      keyCount += entries.length;
      for (const [, child] of entries) {
        visit(child);
      }
      return;
    }

    scalarCount += 1;
  };

  visit(value);

  const trimmed = normalized.trim();
  const lineCount = trimmed.length === 0 ? 0 : trimmed.split(/\r?\n/).length;

  return yamlOptimizationPayloadSchema.parse({
    lineCount,
    keyCount,
    sequenceCount,
    scalarCount,
  });
};

export class YamlCompressionStrategy implements CompressionStrategy {
  public readonly type = CompressionTypeEnum.YAML;

  public format(cleanedInput: string, _request: OptimizationRequest): CompressionOutcome {
    let parsed: unknown;

    try {
      parsed = load(cleanedInput);
    } catch (_error) {
      throw new Error(ERROR_MESSAGES.YAML_INVALID);
    }

    if (parsed === undefined) {
      parsed = {};
    }

    const normalizedRaw = dump(parsed, YAML_DUMP_OPTIONS);
    const normalized = normalizedRaw.trim();
    const payload = collectYamlStats(parsed, normalized);

    return {
      optimizedText: normalized,
      optimizedPayload: payload,
    };
  }
}
