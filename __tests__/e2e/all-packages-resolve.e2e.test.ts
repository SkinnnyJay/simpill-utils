import { describe, expect, it } from "vitest";
import { getEdgeString } from "@simpill/env.utils/client";
import * as Env from "@simpill/env.utils";
import * as Uuid from "@simpill/uuid.utils";
import * as ObjectUtils from "@simpill/object.utils";
import * as Async from "@simpill/async.utils";
import * as ArrayUtils from "@simpill/array.utils";
import * as Errors from "@simpill/errors.utils";
import * as Time from "@simpill/time.utils";

describe("E2E: all critical packages resolve and work", () => {
  it("env client getEdgeString returns string", () => {
    expect(getEdgeString("NODE_ENV", "development")).toBeDefined();
  });

  it("all listed packages are non-null", () => {
    const packages: Record<string, unknown> = {
      Env,
      Uuid,
      ObjectUtils,
      Async,
      ArrayUtils,
      Errors,
      Time,
    };
    for (const [name, mod] of Object.entries(packages)) {
      expect(mod, `Package ${name} should resolve`).not.toBeNull();
      expect(mod, `Package ${name} should be object`).toBeDefined();
    }
  });

  it("cross-package flow: uuid in object pick and array unique", () => {
    const id = Uuid.generateUUID();
    const record = { id, name: "a" };
    const picked = ObjectUtils.pick(record, ["id"]);
    const keys = ArrayUtils.unique(Object.keys(picked));
    expect(keys).toContain("id");
    expect(Uuid.isUUID(picked.id as string)).toBe(true);
  });
});
