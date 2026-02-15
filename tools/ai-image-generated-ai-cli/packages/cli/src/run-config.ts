import { ENV_KEYS, ENGINE_IDS } from "@simpill/image-ai-core";

export function runConfig(): void {
  console.log("Config check:");
  for (const id of ENGINE_IDS) {
    const key =
      id === "gemini"
        ? ENV_KEYS.GEMINI_API_KEY
        : id === "openai"
          ? ENV_KEYS.OPENAI_API_KEY
          : ENV_KEYS.XAI_API_KEY;
    const set = Boolean(process.env[key]);
    console.log(`  ${id}: ${set ? "API key set" : "API key not set"}`);
  }
}
