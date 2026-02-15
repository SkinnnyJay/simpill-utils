import type { ImageEngine } from "../engine.js";
import type { GenerateRequest, GenerateResponse } from "../schemas.js";
import { applyTransparentHint } from "../schemas.js";
import { DEFAULT_MODELS, ENV_KEYS } from "../constants.js";

const DEFAULT_MODEL = DEFAULT_MODELS.GEMINI;

export function createGeminiEngine(apiKey?: string): ImageEngine {
  const key = apiKey ?? process.env[ENV_KEYS.GEMINI_API_KEY] ?? "";
  const modelId =
    process.env[ENV_KEYS.GEMINI_API_MODEL] ?? DEFAULT_MODEL;

  return {
    engineId: "gemini",
    name: "Google Gemini",

    async listModels(): Promise<string[]> {
      return [modelId, DEFAULT_MODEL, "gemini-2.0-flash-exp-image-generation"];
    },

    async generate(request: GenerateRequest): Promise<GenerateResponse> {
      const effectiveModel = request.modelConfig?.engineId === "gemini"
        ? request.modelConfig.modelId
        : modelId;
      const effectiveKey = request.modelConfig?.apiKey ?? key;
      if (!effectiveKey) {
        throw new Error("GEMINI_API_KEY is not set");
      }

      const prompt = applyTransparentHint(request.prompt, request.transparentHint ?? false);
      const input: Array<{ type: "text"; text: string } | { type: "image"; data: string; mime_type: string }> = [
        { type: "text", text: prompt },
      ];
      if (request.inputImageBase64) {
        input.push({
          type: "image",
          data: request.inputImageBase64,
          mime_type: request.inputImageMime ?? "image/png",
        });
      }
      if (request.maskBase64) {
        input.push({
          type: "image",
          data: request.maskBase64,
          mime_type: request.maskMime ?? "image/png",
        });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: effectiveKey });

      const response = await ai.interactions.create({
        model: effectiveModel,
        input,
        response_modalities: ["image"],
      });

      const outputs = Array.isArray(response.outputs) ? response.outputs : [];
      const images: Uint8Array[] = [];
      for (const o of outputs) {
        const part = o as { type?: string; data?: string };
        if (part?.type === "image" && typeof part.data === "string") {
          images.push(Uint8Array.from(Buffer.from(part.data, "base64")));
        }
      }

      if (images.length === 0) {
        throw new Error("Gemini did not return any images.");
      }

      return {
        images: images as GenerateResponse["images"],
        modelUsed: effectiveModel,
        engineId: "gemini",
      };
    },

    getHelp() {
      return [
        {
          command: "generate",
          description: "Generate image(s) with Gemini",
          options: "--prompt, --seed, --aspect-ratio, --count",
        },
        {
          command: "list-models",
          description: "List available Gemini image models",
        },
      ];
    },
  };
}
