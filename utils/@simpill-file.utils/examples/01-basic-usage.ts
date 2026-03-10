/**
 * @simpill/file.utils - Basic usage (Node.js server)
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  ensureDir,
  readFileJson,
  readFileUtf8,
  writeFileJson,
  writeFileUtf8,
} from "@simpill/file.utils/server";

async function main() {
  const tmpDir = path.join(os.tmpdir(), "simpill-file-utils-example");
  await ensureDir(tmpDir);

  const filePath = path.join(tmpDir, "hello.txt");
  await writeFileUtf8(filePath, "Hello from @simpill/file.utils\n");
  const content = await readFileUtf8(filePath);
  console.log("readFileUtf8:", content.trim());

  const jsonPath = path.join(tmpDir, "data.json");
  await writeFileJson(jsonPath, { count: 1, name: "example" });
  const data = await readFileJson<{ count: number; name: string }>(jsonPath);
  console.log("readFileJson:", data);

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

main().catch(console.error);
