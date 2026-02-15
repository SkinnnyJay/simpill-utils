/**
 * @simpill/token-optimizer.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import { cleanPrompt } from "@simpill/token-optimizer.utils";

const result = cleanPrompt({
  text: "  Hello   world  \n\n  tokens  ",
  options: { trim: true, collapseWhitespace: true, normalizeNewlines: true },
});
console.log("cleanPrompt output:", JSON.stringify(result.output));
console.log("appliedTransforms:", result.appliedTransforms.length);
