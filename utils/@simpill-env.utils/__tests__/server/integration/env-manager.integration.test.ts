import * as fs from "node:fs";
import * as path from "node:path";

// Import from index.ts to test module re-exports and get coverage
import {
  Env,
  EnvManager,
  type EnvManagerOptions,
  extendProcessEnvPrototype,
  getEdgeBoolean,
  getEdgeEnv,
  getEdgeNumber,
  getEdgeString,
  hasEdgeEnv,
  isEdgeDev,
  isEdgeProd,
} from "../../../src/index";

describe("Module exports", () => {
  it("should export all edge functions", () => {
    expect(typeof getEdgeEnv).toBe("function");
    expect(typeof getEdgeString).toBe("function");
    expect(typeof getEdgeNumber).toBe("function");
    expect(typeof getEdgeBoolean).toBe("function");
    expect(typeof hasEdgeEnv).toBe("function");
    expect(typeof isEdgeProd).toBe("function");
    expect(typeof isEdgeDev).toBe("function");
  });

  it("should export EnvManager class", () => {
    expect(typeof EnvManager).toBe("function");
    expect(typeof EnvManager.getInstance).toBe("function");
    expect(typeof EnvManager.bootstrap).toBe("function");
    expect(typeof EnvManager.resetInstance).toBe("function");
    expect(typeof EnvManager.resetBootstrap).toBe("function");
    expect(typeof EnvManager.isBootstrapped).toBe("function");
  });

  it("should export Env class", () => {
    expect(typeof Env).toBe("function");
  });

  it("should export extendProcessEnvPrototype function", () => {
    expect(typeof extendProcessEnvPrototype).toBe("function");
  });

  it("should export EnvManagerOptions type (compile-time check)", () => {
    const options: EnvManagerOptions = { envPath: ".env" };
    expect(options.envPath).toBe(".env");
  });
});

describe("EnvManager with .env files", () => {
  const testDir = path.join(__dirname, ".test-env-files");
  const originalEnv = process.env;

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  beforeEach(() => {
    EnvManager.resetInstance();
    EnvManager.resetBootstrap();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    EnvManager.resetInstance();
    EnvManager.resetBootstrap();
    process.env = originalEnv;
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should load variables from a single .env file", () => {
    const envFile = path.join(testDir, "single.env");
    fs.writeFileSync(
      envFile,
      `
SINGLE_STRING=hello
SINGLE_NUMBER=42
SINGLE_BOOL=true
`.trim()
    );

    const manager = EnvManager.getInstance({ envPath: envFile });
    expect(manager.getString("SINGLE_STRING")).toBe("hello");
    expect(manager.getNumber("SINGLE_NUMBER")).toBe(42);
    expect(manager.getBoolean("SINGLE_BOOL")).toBe(true);
  });

  it("should load variables from multiple .env files", () => {
    const envFile1 = path.join(testDir, "multi1.env");
    const envFile2 = path.join(testDir, "multi2.env");
    fs.writeFileSync(envFile1, "MULTI_VAR1=value1\n");
    fs.writeFileSync(envFile2, "MULTI_VAR2=value2\n");

    const manager = EnvManager.getInstance({ envPaths: [envFile1, envFile2] });
    expect(manager.getString("MULTI_VAR1")).toBe("value1");
    expect(manager.getString("MULTI_VAR2")).toBe("value2");
  });

  it("should override file values with process.env values", () => {
    const envFile = path.join(testDir, "override.env");
    fs.writeFileSync(envFile, "OVERRIDE_VAR=file-value\n");
    process.env.OVERRIDE_VAR = "process-value";

    const manager = EnvManager.getInstance({ envPath: envFile });
    expect(manager.getString("OVERRIDE_VAR")).toBe("process-value");
  });

  it("should handle empty .env files gracefully", () => {
    const envFile = path.join(testDir, "empty.env");
    fs.writeFileSync(envFile, "");

    const manager = EnvManager.getInstance({ envPath: envFile });
    expect(manager).toBeDefined();
    expect(manager.getString("NON_EXISTENT", "default")).toBe("default");
  });

  it("should handle .env files with comments", () => {
    const envFile = path.join(testDir, "comments.env");
    fs.writeFileSync(
      envFile,
      `
# This is a comment
COMMENT_VAR=value
# Another comment
`.trim()
    );

    const manager = EnvManager.getInstance({ envPath: envFile });
    expect(manager.getString("COMMENT_VAR")).toBe("value");
  });

  it("should handle .env files with quoted values", () => {
    const envFile = path.join(testDir, "quoted.env");
    fs.writeFileSync(
      envFile,
      `
QUOTED_SINGLE='single quoted'
QUOTED_DOUBLE="double quoted"
`.trim()
    );

    const manager = EnvManager.getInstance({ envPath: envFile });
    expect(manager.getString("QUOTED_SINGLE")).toBe("single quoted");
    expect(manager.getString("QUOTED_DOUBLE")).toBe("double quoted");
  });

  it("should skip non-existent files in envPaths array", () => {
    const existingFile = path.join(testDir, "existing.env");
    const nonExistentFile = path.join(testDir, "non-existent.env");
    fs.writeFileSync(existingFile, "EXISTING_VAR=exists\n");

    const manager = EnvManager.getInstance({
      envPaths: [nonExistentFile, existingFile],
    });
    expect(manager.getString("EXISTING_VAR")).toBe("exists");
  });

  it("should handle multiple non-existent files gracefully", () => {
    const manager = EnvManager.getInstance({
      envPaths: ["/non/existent/path1.env", "/non/existent/path2.env", "/non/existent/path3.env"],
    });
    expect(manager).toBeDefined();
    expect(manager.getString("ANY_VAR", "default")).toBe("default");
  });
});

describe("Full workflow integration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    EnvManager.resetInstance();
    EnvManager.resetBootstrap();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    EnvManager.resetInstance();
    EnvManager.resetBootstrap();
    process.env = originalEnv;
  });

  it("should work end-to-end with EnvManager -> Env -> values", () => {
    process.env.WORKFLOW_STRING = "workflow-value";
    process.env.WORKFLOW_NUMBER = "123";
    process.env.WORKFLOW_BOOL = "true";

    // Use static Env methods (shorthand pattern)
    expect(Env.getString("WORKFLOW_STRING")).toBe("workflow-value");
    expect(Env.getNumber("WORKFLOW_NUMBER")).toBe(123);
    expect(Env.getBoolean("WORKFLOW_BOOL")).toBe(true);

    expect(Env.getString("NON_EXISTENT", "default")).toBe("default");
    expect(Env.getNumber("NON_EXISTENT", 999)).toBe(999);
    expect(Env.getBoolean("NON_EXISTENT", true)).toBe(true);
  });

  it("should work with extendProcessEnvPrototype", () => {
    process.env.EXTEND_STRING = "extend-value";
    process.env.EXTEND_NUMBER = "456";
    process.env.EXTEND_BOOL = "false";

    extendProcessEnvPrototype();

    expect(process.env.getString("EXTEND_STRING", "default")).toBe("extend-value");
    expect(process.env.getNumber("EXTEND_NUMBER", 0)).toBe(456);
    expect(process.env.getBoolean("EXTEND_BOOL", true)).toBe(false);
    expect(process.env.has("EXTEND_STRING")).toBe(true);
    expect(process.env.has("NON_EXISTENT")).toBe(false);
    expect(process.env.getRequired("EXTEND_STRING")).toBe("extend-value");
    expect(() => process.env.getRequired("NON_EXISTENT")).toThrow();
  });

  it("should work with edge functions alongside EnvManager", () => {
    process.env.EDGE_STRING = "edge-value";
    process.env.EDGE_NUMBER = "789";
    process.env.EDGE_BOOL = "true";
    process.env.NODE_ENV = "production";

    expect(getEdgeString("EDGE_STRING", "default")).toBe("edge-value");
    expect(getEdgeNumber("EDGE_NUMBER", 0)).toBe(789);
    expect(getEdgeBoolean("EDGE_BOOL", false)).toBe(true);
    expect(hasEdgeEnv("EDGE_STRING")).toBe(true);
    expect(isEdgeProd()).toBe(true);
    expect(isEdgeDev()).toBe(false);

    const manager = EnvManager.getInstance();
    expect(manager.getString("EDGE_STRING")).toBe("edge-value");
    expect(manager.isProduction()).toBe(true);
  });

  it("should handle bootstrap followed by getInstance", () => {
    const testEnvPath = path.join(__dirname, ".test-bootstrap-workflow.env");
    fs.writeFileSync(testEnvPath, "BOOTSTRAP_WORKFLOW_VAR=bootstrap-value\n");

    try {
      EnvManager.bootstrap([testEnvPath]);
      expect(EnvManager.isBootstrapped()).toBe(true);

      const manager = EnvManager.getInstance();
      expect(manager.getString("BOOTSTRAP_WORKFLOW_VAR")).toBe("bootstrap-value");
    } finally {
      fs.unlinkSync(testEnvPath);
      delete process.env.BOOTSTRAP_WORKFLOW_VAR;
    }
  });

  it("should maintain singleton across multiple getInstance calls", () => {
    process.env.SINGLETON_VAR = "singleton-value";

    const manager1 = EnvManager.getInstance();
    const manager2 = EnvManager.getInstance();
    const manager3 = EnvManager.getInstance();

    expect(manager1).toBe(manager2);
    expect(manager2).toBe(manager3);
    expect(manager1.getString("SINGLETON_VAR")).toBe("singleton-value");
  });
});

describe("Edge and Node compatibility", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    EnvManager.resetInstance();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    EnvManager.resetInstance();
    process.env = originalEnv;
  });

  it("should return consistent values between edge and node functions", () => {
    process.env.COMPAT_STRING = "compat-value";
    process.env.COMPAT_NUMBER = "42";
    process.env.COMPAT_BOOL = "true";

    const manager = EnvManager.getInstance();

    expect(getEdgeString("COMPAT_STRING", "")).toBe(manager.getString("COMPAT_STRING"));
    expect(getEdgeNumber("COMPAT_NUMBER", 0)).toBe(manager.getNumber("COMPAT_NUMBER"));
    expect(getEdgeBoolean("COMPAT_BOOL", false)).toBe(manager.getBoolean("COMPAT_BOOL"));
  });

  it("should handle NODE_ENV consistently", () => {
    process.env.NODE_ENV = "production";

    const manager = EnvManager.getInstance();

    expect(isEdgeProd()).toBe(manager.isProduction());
    expect(isEdgeDev()).toBe(!manager.isProduction());
  });
});

describe("snapshotProcessEnv edge cases", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    EnvManager.resetInstance();
    EnvManager.resetBootstrap();
  });

  afterEach(() => {
    EnvManager.resetInstance();
    EnvManager.resetBootstrap();
    process.env = originalEnv;
  });

  it("should skip undefined values in process.env", () => {
    const customEnv: Record<string, string | undefined> = {
      DEFINED_VAR: "defined-value",
      UNDEFINED_VAR: undefined,
      ANOTHER_DEFINED: "another-value",
    };
    process.env = customEnv as NodeJS.ProcessEnv;

    const manager = EnvManager.getInstance();
    expect(manager.getString("DEFINED_VAR")).toBe("defined-value");
    expect(manager.getString("ANOTHER_DEFINED")).toBe("another-value");
    expect(manager.getValue("UNDEFINED_VAR")).toBeUndefined();
  });

  it("should handle process.env with mixed defined and undefined values", () => {
    const customEnv: Record<string, string | undefined> = {
      VAR1: "value1",
      VAR2: undefined,
      VAR3: "value3",
      VAR4: undefined,
      VAR5: "value5",
    };
    process.env = customEnv as NodeJS.ProcessEnv;

    const manager = EnvManager.getInstance();
    expect(manager.has("VAR1")).toBe(true);
    expect(manager.has("VAR2")).toBe(false);
    expect(manager.has("VAR3")).toBe(true);
    expect(manager.has("VAR4")).toBe(false);
    expect(manager.has("VAR5")).toBe(true);
  });
});
