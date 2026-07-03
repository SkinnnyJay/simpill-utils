import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync as nodeReadFileSync,
  writeFileSync as nodeWriteFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  isPathUnderRoot,
  isPathUnderRootReal,
  isPathUnderRootRealSync,
  JsonParseError,
  pathExists,
  pathExistsSync,
  readFileJson,
  readFileJsonSync,
  resolvePathUnderRoot,
  resolvePathUnderRootReal,
  resolvePathUnderRootRealSync,
  writeFileAtomic,
  writeFileAtomicSync,
  writeFileJson,
  writeFileJsonSync,
} from "../../../src/server";

const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

describe("file.utils uplift", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "file-uplift-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("readFileJson — BOM handling (frozen ref crashes)", () => {
    it("parses a UTF-8 BOM-prefixed JSON file (async)", async () => {
      const p = join(tmpDir, "bom.json");
      nodeWriteFileSync(p, Buffer.concat([BOM, Buffer.from('{"a":1}')]));
      await expect(readFileJson<{ a: number }>(p)).resolves.toEqual({ a: 1 });
    });

    it("parses a UTF-8 BOM-prefixed JSON file (sync)", () => {
      const p = join(tmpDir, "bom-sync.json");
      nodeWriteFileSync(p, Buffer.concat([BOM, Buffer.from('{"b":2}')]));
      expect(readFileJsonSync<{ b: number }>(p)).toEqual({ b: 2 });
    });
  });

  describe("readFileJson — JsonParseError with file path", () => {
    it("throws JsonParseError including the file path (async)", async () => {
      const p = join(tmpDir, "bad.json");
      nodeWriteFileSync(p, "{bad json");
      await expect(readFileJson(p)).rejects.toThrow(JsonParseError);
      await expect(readFileJson(p)).rejects.toThrow(p);
    });

    it("JsonParseError extends SyntaxError, keeps path and cause (sync)", () => {
      const p = join(tmpDir, "bad-sync.json");
      nodeWriteFileSync(p, "not json");
      let caught: unknown;
      try {
        readFileJsonSync(p);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(JsonParseError);
      expect(caught).toBeInstanceOf(SyntaxError);
      const err = caught as JsonParseError;
      expect(err.path).toBe(p);
      expect((err as { cause?: unknown }).cause).toBeInstanceOf(SyntaxError);
    });

    it("validate errors propagate unchanged (not wrapped)", async () => {
      const p = join(tmpDir, "valid.json");
      nodeWriteFileSync(p, '{"x":1}');
      await expect(
        readFileJson(p, {
          validate: () => {
            throw new Error("invalid shape");
          },
        }),
      ).rejects.toThrow("invalid shape");
    });
  });

  describe("readFileJson — reviver and defaultValue", () => {
    it("applies reviver during parse", async () => {
      const p = join(tmpDir, "reviver.json");
      nodeWriteFileSync(p, '{"n":1}');
      const out = await readFileJson<{ n: number }>(p, {
        reviver: (key, value) => (key === "n" ? (value as number) * 10 : value),
      });
      expect(out).toEqual({ n: 10 });
    });

    it("returns defaultValue on ENOENT, async and sync", async () => {
      const p = join(tmpDir, "missing.json");
      await expect(readFileJson(p, { defaultValue: { d: true } })).resolves.toEqual({ d: true });
      expect(readFileJsonSync(p, { defaultValue: null })).toBeNull();
    });

    it("defaultValue does NOT swallow parse errors", async () => {
      const p = join(tmpDir, "corrupt.json");
      nodeWriteFileSync(p, "{{{");
      await expect(readFileJson(p, { defaultValue: {} })).rejects.toThrow(JsonParseError);
    });

    it("without defaultValue, ENOENT still throws", async () => {
      await expect(readFileJson(join(tmpDir, "nope.json"))).rejects.toThrow("ENOENT");
    });
  });

  describe("writeFileAtomic", () => {
    it("writes content and creates parent dirs (async)", async () => {
      const p = join(tmpDir, "deep", "atomic.txt");
      await writeFileAtomic(p, "atomic content");
      expect(nodeReadFileSync(p, "utf8")).toBe("atomic content");
    });

    it("writes content and creates parent dirs (sync)", () => {
      const p = join(tmpDir, "deep2", "atomic-sync.txt");
      writeFileAtomicSync(p, "sync atomic");
      expect(nodeReadFileSync(p, "utf8")).toBe("sync atomic");
    });

    it("supports Buffer data and encodings", async () => {
      const p = join(tmpDir, "buf.bin");
      await writeFileAtomic(p, Buffer.from([1, 2, 3]));
      expect([...nodeReadFileSync(p)]).toEqual([1, 2, 3]);
      const p2 = join(tmpDir, "b64.txt");
      writeFileAtomicSync(p2, Buffer.from("hi").toString("base64"), { encoding: "base64" });
      expect(nodeReadFileSync(p2, "utf8")).toBe("hi");
    });

    it("leaves no temp files behind on success", async () => {
      const p = join(tmpDir, "clean.txt");
      await writeFileAtomic(p, "one");
      writeFileAtomicSync(p, "two");
      expect(readdirSync(tmpDir).filter((f) => f.endsWith(".tmp"))).toEqual([]);
    });

    it("preserves the existing file's mode across the rewrite", async () => {
      const p = join(tmpDir, "mode.txt");
      nodeWriteFileSync(p, "v1");
      chmodSync(p, 0o600);
      await writeFileAtomic(p, "v2");
      expect(statSync(p).mode & 0o777).toBe(0o600);
      expect(nodeReadFileSync(p, "utf8")).toBe("v2");
    });

    it("serializes concurrent writes to the same path in call order", async () => {
      const p = join(tmpDir, "serial.txt");
      await Promise.all([
        writeFileAtomic(p, "first"),
        writeFileAtomic(p, "second"),
        writeFileAtomic(p, "third"),
      ]);
      expect(nodeReadFileSync(p, "utf8")).toBe("third");
      expect(readdirSync(tmpDir).filter((f) => f.endsWith(".tmp"))).toEqual([]);
    });

    it("cleans up the temp file and rethrows when the rename fails", () => {
      // renaming a file over an existing non-empty DIRECTORY fails => exercises the error path
      const target = join(tmpDir, "isdir");
      mkdirSync(join(target, "child"), { recursive: true });
      expect(() => writeFileAtomicSync(target, "boom")).toThrow();
      expect(readdirSync(tmpDir).filter((f) => f.endsWith(".tmp"))).toEqual([]);
    });
  });

  describe("writeFileJson — sortKeys / finalNewline / atomic", () => {
    it("default output is byte-identical to the frozen behavior", async () => {
      const p = join(tmpDir, "compat.json");
      await writeFileJson(p, { a: 1 }, { space: 0 });
      expect(nodeReadFileSync(p, "utf8")).toBe('{"a":1}');
    });

    it("sortKeys produces deterministic recursive key order", () => {
      const p = join(tmpDir, "sorted.json");
      writeFileJsonSync(p, { b: 2, a: { z: 1, y: [{ q: 1, p: 2 }] } }, { sortKeys: true });
      expect(nodeReadFileSync(p, "utf8")).toBe('{"a":{"y":[{"p":2,"q":1}],"z":1},"b":2}');
    });

    it("finalNewline appends a trailing newline", async () => {
      const p = join(tmpDir, "nl.json");
      await writeFileJson(p, { a: 1 }, { finalNewline: true });
      expect(nodeReadFileSync(p, "utf8")).toBe('{"a":1}\n');
    });

    it("atomic option routes through the atomic writer", async () => {
      const p = join(tmpDir, "atomic.json");
      await writeFileJson(p, { a: 1 }, { atomic: true, space: 2 });
      expect(JSON.parse(nodeReadFileSync(p, "utf8"))).toEqual({ a: 1 });
      expect(readdirSync(tmpDir).filter((f) => f.endsWith(".tmp"))).toEqual([]);
    });
  });

  describe("pathExists", () => {
    it("true for existing file/dir, false for missing", async () => {
      const p = join(tmpDir, "exists.txt");
      nodeWriteFileSync(p, "x");
      await expect(pathExists(p)).resolves.toBe(true);
      await expect(pathExists(tmpDir)).resolves.toBe(true);
      await expect(pathExists(join(tmpDir, "missing"))).resolves.toBe(false);
      expect(pathExistsSync(p)).toBe(true);
      expect(pathExistsSync(join(tmpDir, "missing"))).toBe(false);
    });
  });

  describe("path traversal — symlink-aware guards", () => {
    let outsideDir: string;

    beforeEach(() => {
      outsideDir = mkdtempSync(join(tmpdir(), "file-uplift-outside-"));
      nodeWriteFileSync(join(outsideDir, "secret.txt"), "SECRET");
      symlinkSync(outsideDir, join(tmpDir, "escape"));
    });

    afterEach(() => {
      rmSync(outsideDir, { recursive: true, force: true });
    });

    it("PROOF: the lexical guard passes a symlink that escapes the root", () => {
      // The frozen ref's only guard. This is the vulnerability.
      expect(isPathUnderRoot(tmpDir, "escape/secret.txt")).toBe(true);
      expect(() => resolvePathUnderRoot(tmpDir, "escape/secret.txt")).not.toThrow();
    });

    it("isPathUnderRootReal rejects the symlink escape (async + sync)", async () => {
      await expect(isPathUnderRootReal(tmpDir, "escape/secret.txt")).resolves.toBe(false);
      expect(isPathUnderRootRealSync(tmpDir, "escape/secret.txt")).toBe(false);
    });

    it("resolvePathUnderRootReal throws on the symlink escape", async () => {
      await expect(resolvePathUnderRootReal(tmpDir, "escape/secret.txt")).rejects.toThrow(
        "outside root",
      );
      expect(() => resolvePathUnderRootRealSync(tmpDir, "escape/secret.txt")).toThrow(
        "outside root",
      );
    });

    it("rejects creating a NEW file under an escaping symlinked dir", async () => {
      await expect(isPathUnderRootReal(tmpDir, "escape/new-file.txt")).resolves.toBe(false);
      expect(() => resolvePathUnderRootRealSync(tmpDir, "escape/new-file.txt")).toThrow(
        "outside root",
      );
    });

    it("still accepts legitimate paths, existing and not-yet-existing", async () => {
      nodeWriteFileSync(join(tmpDir, "ok.txt"), "fine");
      await expect(isPathUnderRootReal(tmpDir, "ok.txt")).resolves.toBe(true);
      await expect(resolvePathUnderRootReal(tmpDir, "sub/new.txt")).resolves.toMatch(
        /sub[/\\]new\.txt$/,
      );
      expect(isPathUnderRootRealSync(tmpDir, "brand/new/deep.txt")).toBe(true);
    });

    it("accepts a symlink that stays INSIDE the root", async () => {
      mkdirSync(join(tmpDir, "realdir"));
      nodeWriteFileSync(join(tmpDir, "realdir", "f.txt"), "ok");
      symlinkSync(join(tmpDir, "realdir"), join(tmpDir, "innerlink"));
      await expect(isPathUnderRootReal(tmpDir, "innerlink/f.txt")).resolves.toBe(true);
      expect(() => resolvePathUnderRootRealSync(tmpDir, "innerlink/f.txt")).not.toThrow();
    });

    it("still rejects plain ../ traversal", async () => {
      await expect(isPathUnderRootReal(tmpDir, "../../etc/passwd")).resolves.toBe(false);
      expect(() => resolvePathUnderRootRealSync(tmpDir, "../../etc/passwd")).toThrow(
        "outside root",
      );
    });
  });
});
