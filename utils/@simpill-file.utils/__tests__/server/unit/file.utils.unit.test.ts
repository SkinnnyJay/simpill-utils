import {
  mkdtempSync,
  readFileSync as nodeReadFileSync,
  writeFileSync as nodeWriteFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  basename,
  dirname,
  ensureDir,
  ensureDirSync,
  extname,
  isAbsolutePath,
  isPathUnderRoot,
  joinPath,
  normalizePath,
  readFileJson,
  readFileJsonSync,
  readFileSync,
  readFileUtf8,
  readFileUtf8Sync,
  resolvePath,
  resolvePathUnderRoot,
  writeFileJson,
  writeFileJsonSync,
  writeFileSync,
  writeFileUtf8,
  writeFileUtf8Sync,
} from "../../../src/server";

describe("file.utils", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "file-utils-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("readFileUtf8", () => {
    it("reads file as string", async () => {
      const p = join(tmpDir, "a.txt");
      writeFileSync(p, "hello");
      const out = await readFileUtf8(p);
      expect(out).toBe("hello");
    });
  });

  describe("readFileJson", () => {
    it("parses JSON file", async () => {
      const p = join(tmpDir, "b.json");
      writeFileSync(p, '{"x":1}');
      const out = await readFileJson<{ x: number }>(p);
      expect(out).toEqual({ x: 1 });
    });
    it("validates with options.validate when provided", async () => {
      const p = join(tmpDir, "valid.json");
      writeFileSync(p, '{"x":1}');
      const out = await readFileJson<{ x: number }>(p, {
        validate: (d) => {
          if (typeof d !== "object" || d === null || !("x" in d))
            throw new Error("expected { x: number }");
          return d as { x: number };
        },
      });
      expect(out).toEqual({ x: 1 });
    });
    it("throws when validate throws", async () => {
      const p = join(tmpDir, "bad.json");
      writeFileSync(p, '"not an object"');
      await expect(
        readFileJson(p, {
          validate: () => {
            throw new Error("invalid shape");
          },
        }),
      ).rejects.toThrow("invalid shape");
    });
  });

  describe("writeFileUtf8", () => {
    it("writes string and creates parent dirs", async () => {
      const p = join(tmpDir, "sub", "c.txt");
      await writeFileUtf8(p, "content");
      expect(readFileSync(p, "utf8")).toBe("content");
    });
  });

  describe("writeFileJson", () => {
    it("writes JSON and creates parent dirs", async () => {
      const p = join(tmpDir, "deep", "d.json");
      await writeFileJson(p, { a: 1 }, { space: 0 });
      expect(readFileSync(p, "utf8")).toBe('{"a":1}');
    });
    it("pretty-prints with space", async () => {
      const p = join(tmpDir, "e.json");
      await writeFileJson(p, { a: 1 }, { space: 2 });
      expect(readFileSync(p, "utf8")).toContain("\n");
    });
  });

  describe("ensureDir", () => {
    it("creates directory", async () => {
      const p = join(tmpDir, "newdir");
      await ensureDir(p);
      expect(statSync(p).isDirectory()).toBe(true);
    });
    it("is idempotent", async () => {
      const p = join(tmpDir, "idem");
      await ensureDir(p);
      await ensureDir(p);
    });
  });

  describe("readFileUtf8Sync", () => {
    it("reads file as string", () => {
      const p = join(tmpDir, "sync.txt");
      nodeWriteFileSync(p, "sync hello");
      expect(readFileUtf8Sync(p)).toBe("sync hello");
    });
  });

  describe("readFileJsonSync", () => {
    it("parses JSON file", () => {
      const p = join(tmpDir, "sync.json");
      nodeWriteFileSync(p, '{"y":2}');
      expect(readFileJsonSync<{ y: number }>(p)).toEqual({ y: 2 });
    });
  });

  describe("readFileSync", () => {
    it("returns UTF-8 string when called with one arg", () => {
      const p = join(tmpDir, "one.txt");
      nodeWriteFileSync(p, "one");
      expect(readFileSync(p)).toBe("one");
    });
    it("returns Buffer when encoding is undefined", () => {
      const p = join(tmpDir, "buf");
      nodeWriteFileSync(p, "x");
      const buf = readFileSync(p, undefined);
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.toString("utf8")).toBe("x");
    });
  });

  describe("writeFileUtf8Sync", () => {
    it("writes string and creates parent dirs", () => {
      const p = join(tmpDir, "sub2", "sync.txt");
      writeFileUtf8Sync(p, "sync content");
      expect(nodeReadFileSync(p, "utf8")).toBe("sync content");
    });
  });

  describe("writeFileJsonSync", () => {
    it("writes JSON and creates parent dirs", () => {
      const p = join(tmpDir, "deep2", "f.json");
      writeFileJsonSync(p, { z: 3 }, { space: 0 });
      expect(nodeReadFileSync(p, "utf8")).toBe('{"z":3}');
    });
  });

  describe("ensureDirSync", () => {
    it("creates directory", () => {
      const p = join(tmpDir, "syncdir");
      ensureDirSync(p);
      expect(statSync(p).isDirectory()).toBe(true);
    });
    it("is idempotent", () => {
      const p = join(tmpDir, "syncidem");
      ensureDirSync(p);
      ensureDirSync(p);
    });
  });

  describe("path.utils", () => {
    it("joinPath joins segments", () => {
      expect(joinPath("a", "b", "c")).toBe(join("a", "b", "c"));
    });
    it("resolvePath resolves to absolute", () => {
      const r = resolvePath(".");
      expect(r).toBe(process.cwd());
    });
    it("normalizePath normalizes slashes and segments", () => {
      expect(normalizePath("a/../b")).toBe("b");
    });
    it("basename returns last portion", () => {
      expect(basename("/foo/bar/baz.json")).toBe("baz.json");
      expect(basename("/foo/bar/baz.json", ".json")).toBe("baz");
    });
    it("dirname returns directory", () => {
      expect(dirname("/foo/bar/baz")).toBe("/foo/bar");
    });
    it("extname returns extension", () => {
      expect(extname("file.json")).toBe(".json");
    });
    it("isAbsolutePath returns true for absolute paths", () => {
      expect(isAbsolutePath("/foo")).toBe(true);
      expect(isAbsolutePath("foo")).toBe(false);
    });
    it("isPathUnderRoot returns true when path is under root", () => {
      expect(isPathUnderRoot(tmpDir, "a")).toBe(true);
      expect(isPathUnderRoot(tmpDir, "a/b")).toBe(true);
      expect(isPathUnderRoot(tmpDir, "..")).toBe(false);
    });
    it("resolvePathUnderRoot returns path under root and throws when outside", () => {
      const under = resolvePathUnderRoot(tmpDir, "sub/file");
      expect(under).toContain(tmpDir);
      expect(under).toMatch(/sub[/\\]file$/);
      expect(() => resolvePathUnderRoot(tmpDir, "../../etc/passwd")).toThrow("outside root");
    });
  });
});
