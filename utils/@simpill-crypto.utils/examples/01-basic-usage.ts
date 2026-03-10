/**
 * @simpill/crypto.utils - Basic usage (Node.js server)
 *
 * Run from package dir after: npm install && npm run build
 *   node -r ts-node/register examples/01-basic-usage.ts
 * or: npx ts-node examples/01-basic-usage.ts (with tsconfig paths / linked package)
 */

import { hash, randomBytesHex } from "@simpill/crypto.utils/server";

function main() {
  // Hash (sync): hash(data, algorithm?)
  const digest = hash("hello", "sha256");
  console.log("sha256(hello):", digest.slice(0, 32) + "...");

  // Random bytes as hex string
  const token = randomBytesHex(16);
  console.log("randomBytesHex(16):", token);
}

main();
