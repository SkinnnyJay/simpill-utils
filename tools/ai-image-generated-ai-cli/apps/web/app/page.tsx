import {
  discoverPrompts,
  registerPrompts,
  type PromptEntry,
} from "@simpill/image-ai-core";
import { PromptDiscoveryClient } from "./prompt-discovery-client";

const SEED_PROMPTS: PromptEntry[] = [
  {
    id: "isometric-sprite",
    label: "Isometric game sprite",
    template:
      "Isometric pixel art sprite, top-down view, 16-bit style, transparent background",
    tags: ["game", "sprite", "isometric"],
    modelHint: "gemini",
  },
  {
    id: "portrait",
    label: "Portrait",
    template: "Professional portrait photograph, soft lighting, neutral background",
    tags: ["portrait", "photo"],
  },
  {
    id: "landscape",
    label: "Landscape",
    template: "Epic landscape, golden hour, detailed environment",
    tags: ["landscape", "environment"],
    modelHint: "openai",
  },
];

registerPrompts(SEED_PROMPTS);
const initialPrompts = discoverPrompts({});

export default function PromptDiscoveryPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Prompt discovery</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Browse and filter prompt templates. Use tags, search, or engine hint.
      </p>
      <PromptDiscoveryClient initialPrompts={initialPrompts} />
    </main>
  );
}
