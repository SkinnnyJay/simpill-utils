#!/usr/bin/env node
import { CLI_BINARY_NAME, ENGINE_IDS, type EngineId } from "@simpill/image-ai-core";
import { COMMAND_SPECS } from "./commands.js";
import { getCLIEngine } from "./engine-singleton.js";
import { runListModels } from "./run-list-models.js";
import { runDiscover } from "./run-discover.js";
import { runGenerate } from "./run-generate.js";
import { runConfig } from "./run-config.js";
import { runRunTool } from "./run-run-tool.js";
import { runListTools } from "./run-list-tools.js";

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"] as const;
type AspectRatio = (typeof ASPECT_RATIOS)[number];

function parseArgv(argv: string[]): { command: string; args: string[]; options: Record<string, string | string[] | boolean> } {
  const args = argv.slice(2);
  const options: Record<string, string | string[] | boolean> = {};
  const positionals: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === undefined) continue;
    if (arg.startsWith("--")) {
      const key = arg.slice(2).replace(/-/g, "-");
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        if (key === "tag") {
          const arr = (options[key] as string[] | undefined) ?? [];
          arr.push(next);
          options[key] = arr;
        } else {
          options[key] = next;
        }
        i++;
      } else {
        options[key] = true;
      }
    } else {
      positionals.push(arg);
    }
  }

  const command = positionals[0] ?? "help";
  const rest = positionals.slice(1);
  return { command, args: rest, options };
}

function getEngineFromOptions(options: Record<string, string | string[] | boolean>): EngineId {
  const e = options["engine"];
  if (typeof e === "string" && ENGINE_IDS.includes(e as EngineId)) {
    return e as EngineId;
  }
  return "gemini";
}

function printHelp(commandName?: string): void {
  if (commandName) {
    const spec = COMMAND_SPECS.find((c) => c.name === commandName);
    if (spec) {
      console.log(`${CLI_BINARY_NAME} ${spec.name}`);
      console.log(spec.description);
      for (const opt of spec.options) {
        console.log(`  ${opt.name}: ${opt.description}`);
      }
      const engine = getCLIEngine("gemini");
      const engineHelp = engine.getHelp?.();
      if (engineHelp?.length) {
        console.log("Engine-specific help:");
        for (const h of engineHelp) {
          console.log(`  ${h.command}: ${h.description}`);
        }
      }
      return;
    }
  }

  console.log(`Usage: ${CLI_BINARY_NAME} <command> [options]`);
  console.log("Commands:");
  for (const c of COMMAND_SPECS) {
    console.log(`  ${c.name}\t${c.description}`);
  }
  console.log(`\nDefault engine: gemini. Use --engine openai| xai to switch.`);
}

async function main(): Promise<void> {
  const { command, args, options } = parseArgv(process.argv);
  const engineId = getEngineFromOptions(options);

  try {
    switch (command) {
      case "list-models": {
        await runListModels(engineId);
        break;
      }
      case "discover": {
        const tags = options["tag"];
        runDiscover({
          tags: Array.isArray(tags) ? tags : typeof tags === "string" ? [tags] : undefined,
          query: typeof options["query"] === "string" ? options["query"] : undefined,
          engineHint: typeof options["engine"] === "string" && ENGINE_IDS.includes(options["engine"] as EngineId)
            ? (options["engine"] as EngineId)
            : undefined,
        });
        break;
      }
      case "generate": {
        const prompt = options["prompt"];
        if (typeof prompt !== "string" || !prompt) {
          console.error("--prompt is required");
          process.exit(1);
        }
        const inputImage = typeof options["input-image"] === "string" ? options["input-image"] : undefined;
        const inputMeta = typeof options["input-meta"] === "string" ? options["input-meta"] : undefined;
        const outputImage = typeof options["output-image"] === "string" ? options["output-image"] : undefined;
        const outputMeta = typeof options["output-meta"] === "string" ? options["output-meta"] : undefined;
        if ((inputImage != null || inputMeta != null || outputImage != null) && !(inputImage && inputMeta && outputImage)) {
          console.error("Asset mode requires all of: --input-image, --input-meta, --output-image");
          process.exit(1);
        }
        await runGenerate({
          prompt,
          engineId,
          apiKey: undefined,
          seed: typeof options["seed"] === "string" ? parseInt(options["seed"], 10) : undefined,
          aspectRatio:
            typeof options["aspect-ratio"] === "string" &&
            ASPECT_RATIOS.includes(options["aspect-ratio"] as AspectRatio)
              ? (options["aspect-ratio"] as AspectRatio)
              : undefined,
          count: typeof options["count"] === "string" ? parseInt(options["count"], 10) : undefined,
          out: typeof options["out"] === "string" ? options["out"] : undefined,
          inputImagePath: inputImage,
          inputMetaPath: inputMeta,
          outputImagePath: outputImage,
          outputMetaPath: outputMeta,
        });
        break;
      }
      case "config": {
        runConfig();
        break;
      }
      case "run-tool": {
        const toolId = options["tool"];
        const inImg = options["input-image"];
        const inMeta = options["input-meta"];
        const outImg = options["output-image"];
        if (typeof toolId !== "string" || typeof inImg !== "string" || typeof inMeta !== "string" || typeof outImg !== "string") {
          console.error("run-tool requires: --tool, --input-image, --input-meta, --output-image");
          process.exit(1);
        }
        await runRunTool({
          toolId,
          inputImagePath: inImg,
          inputMetaPath: inMeta,
          outputImagePath: outImg,
          outputMetaPath: typeof options["output-meta"] === "string" ? options["output-meta"] : undefined,
          prompt: typeof options["prompt"] === "string" ? options["prompt"] : undefined,
          engineId: getEngineFromOptions(options),
        });
        break;
      }
      case "list-tools": {
        runListTools();
        break;
      }
      case "help":
      default: {
        const helpArg = args[0];
        printHelp(command === "help" ? helpArg : undefined);
        break;
      }
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
