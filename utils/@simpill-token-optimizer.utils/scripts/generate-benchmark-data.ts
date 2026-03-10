/**
 * Generates benchmark data files (CSV, TXT, JSON, MD, XML, JSONL) at target sizes
 * using @faker-js/faker (seeded). Writes to data/benchmark/ and a manifest.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { en, Faker } from "@faker-js/faker";

const BENCHMARK_DIR = path.join(__dirname, "..", "data", "benchmark");
const REPORTS_DIR = path.join(BENCHMARK_DIR, "reports");
const DEFAULT_SEED = 42;
const SIZES_MB: readonly number[] = process.env.BENCHMARK_SIZES_MB
  ? process.env.BENCHMARK_SIZES_MB.split(",").map(Number)
  : ([1, 5, 20] as const);
const BYTES_PER_MB = 1024 * 1024;

type Format = "csv" | "txt" | "json" | "md" | "xml" | "jsonl";

interface ManifestEntry {
  path: string;
  format: Format;
  targetSizeBytes: number;
  actualBytes: number;
  seed: number;
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createSeededFaker(seed: number): Faker {
  return new Faker({ locale: [en], seed });
}

function generateCsv(faker: Faker, targetBytes: number): string {
  const header = "id,name,value,email,created\n";
  let out = header;
  const encoder = new TextEncoder();
  while (encoder.encode(out).length < targetBytes) {
    out += `${faker.number.int({ min: 1, max: 999999 })},${faker.string.alphanumeric(20)},${faker.number.int({ min: 0, max: 1000 })},${faker.internet.email()},${faker.date.anytime().toISOString()}\n`;
  }
  const lines = out.split("\n");
  out = lines[0];
  for (let i = 1; i < lines.length; i++) {
    const next = out + (i === 1 ? "" : "\n") + lines[i];
    if (encoder.encode(next).length <= targetBytes) out = next;
    else break;
  }
  return out;
}

function generateTxt(faker: Faker, targetBytes: number): string {
  const encoder = new TextEncoder();
  let out = "";
  while (encoder.encode(out).length < targetBytes) {
    out += `${faker.string.alphanumeric(60)}\n`;
  }
  const buf = encoder.encode(out);
  if (buf.length > targetBytes) {
    return new TextDecoder().decode(buf.subarray(0, targetBytes));
  }
  return out;
}

function generateJson(faker: Faker, targetBytes: number): string {
  const arr: Record<string, unknown>[] = [];
  let s = "[]";
  while (true) {
    arr.push({
      id: faker.string.uuid(),
      name: faker.string.alphanumeric(24),
      value: faker.number.int({ min: 0, max: 1000 }),
      active: faker.datatype.boolean(),
      email: faker.internet.email(),
      createdAt: faker.date.anytime().toISOString(),
    });
    s = JSON.stringify(arr);
    if (s.length >= targetBytes) break;
  }
  if (s.length > targetBytes) {
    arr.pop();
    s = JSON.stringify(arr);
  }
  if (s.length > targetBytes) {
    while (arr.length > 0 && JSON.stringify(arr).length > targetBytes) arr.pop();
    s = JSON.stringify(arr);
  }
  return s;
}

function generateMd(faker: Faker, targetBytes: number): string {
  const encoder = new TextEncoder();
  let out = "# Benchmark Document\n\n";
  const parts = [
    () => `## ${faker.string.alphanumeric(30)}\n\n`,
    () => `${faker.string.alphanumeric(120)}\n\n`,
    () => `- ${faker.string.alphanumeric(40)}\n`,
    () => `\`\`\`\n${faker.string.alphanumeric(80)}\n\`\`\`\n\n`,
  ];
  let i = 0;
  while (encoder.encode(out).length < targetBytes) {
    out += parts[i % parts.length]();
    i++;
  }
  const buf = encoder.encode(out);
  if (buf.length > targetBytes) {
    return new TextDecoder().decode(buf.subarray(0, targetBytes));
  }
  return out;
}

function generateXml(faker: Faker, targetBytes: number): string {
  const encoder = new TextEncoder();
  let out = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';
  while (encoder.encode(out).length < targetBytes - 20) {
    out += `  <item id="${faker.string.uuid()}" name="${faker.string.alphanumeric(20)}">${faker.string.alphanumeric(40)}</item>\n`;
  }
  out += "</root>";
  const buf = encoder.encode(out);
  if (buf.length > targetBytes) {
    const trimAt = targetBytes - 8;
    out = `${new TextDecoder().decode(buf.subarray(0, trimAt))}\n</root>`;
  }
  return out;
}

function generateJsonl(faker: Faker, targetBytes: number): string {
  const encoder = new TextEncoder();
  const lines: string[] = [];
  let total = 0;
  while (total < targetBytes) {
    const obj = {
      id: faker.string.uuid(),
      name: faker.string.alphanumeric(24),
      value: faker.number.int({ min: 0, max: 1000 }),
      email: faker.internet.email(),
    };
    const line = `${JSON.stringify(obj)}\n`;
    if (total + encoder.encode(line).length > targetBytes) break;
    lines.push(line);
    total += encoder.encode(line).length;
  }
  return lines.join("");
}

const generators: Record<Format, (faker: Faker, targetBytes: number) => string> = {
  csv: generateCsv,
  txt: generateTxt,
  json: generateJson,
  md: generateMd,
  xml: generateXml,
  jsonl: generateJsonl,
};

function main(): void {
  const seed = Number(process.env.BENCHMARK_SEED) || DEFAULT_SEED;
  const faker = createSeededFaker(seed);
  ensureDir(BENCHMARK_DIR);
  ensureDir(REPORTS_DIR);

  const manifest: ManifestEntry[] = [];

  for (const sizeMb of SIZES_MB) {
    const targetBytes = sizeMb * BYTES_PER_MB;
    for (const format of Object.keys(generators) as Format[]) {
      const content = generators[format](faker, targetBytes);
      const actualBytes = new TextEncoder().encode(content).length;
      const basename = `${format}-${sizeMb}mb`;
      const ext = format === "md" ? "md" : format;
      const filename = `${basename}.${ext}`;
      const filePath = path.join(BENCHMARK_DIR, filename);
      fs.writeFileSync(filePath, content, "utf8");
      manifest.push({
        path: filename,
        format,
        targetSizeBytes: targetBytes,
        actualBytes,
        seed,
      });
    }
  }

  const manifestPath = path.join(BENCHMARK_DIR, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Generated benchmark data in ${BENCHMARK_DIR}`);
  console.log(`Manifest: ${manifestPath} (${manifest.length} entries)`);
}

main();
