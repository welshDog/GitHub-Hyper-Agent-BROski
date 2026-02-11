// src/config.ts
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import dotenv from "dotenv";
import { z } from "zod";
import { fileURLToPath } from "url";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
var StudioConfigSchema = z.object({
  hardware: z.object({
    microphone: z.object({
      recommended: z.array(z.string()),
      filters: z.array(z.string()),
      interface: z.string()
    }),
    camera: z.object({
      resolution: z.string(),
      framing: z.string()
    }),
    screen: z.object({
      resolution: z.string(),
      aspectRatio: z.string()
    })
  }),
  software: z.object({
    ide: z.string(),
    theme: z.string(),
    font: z.object({
      family: z.string(),
      ligatures: z.boolean(),
      size: z.object({
        editor: z.number().min(16).max(24),
        terminal: z.number().min(16).max(24)
      })
    }),
    ui: z.object({
      hideActivityBar: z.boolean(),
      hideMinimap: z.boolean(),
      cursorBlinking: z.string(),
      screencastMode: z.boolean()
    })
  }),
  recording: z.object({
    obs: z.object({
      canvas: z.string(),
      fps: z.number(),
      bitrateKbps: z.number(),
      audioFilters: z.array(z.string())
    })
  }),
  project: z.object({
    branching: z.object({
      main: z.string(),
      starter: z.string(),
      checkpoints: z.array(z.string())
    }),
    hygiene: z.object({
      linter: z.string(),
      formatter: z.string()
    })
  })
});
var DatabaseConfigSchema = z.object({
  host: z.string(),
  port: z.coerce.number(),
  username: z.string().min(1, "DB_USER is required"),
  password: z.string().min(1, "DB_PASS is required"),
  name: z.string(),
  pool: z.object({
    min: z.number(),
    max: z.number()
  }),
  ssl: z.union([z.boolean(), z.string().transform((val) => val === "true")])
});
var ApiConfigSchema = z.object({
  baseUrl: z.string().url(),
  timeoutMs: z.number(),
  retryAttempts: z.number(),
  services: z.record(z.string(), z.object({
    url: z.string().url(),
    apiKey: z.string().optional(),
    publicKey: z.string().optional()
  }))
});
var AppConfigSchema = z.object({
  env: z.enum(["development", "staging", "production", "test"]),
  port: z.coerce.number(),
  serviceName: z.string(),
  logging: z.object({
    level: z.enum(["debug", "info", "warn", "error"]),
    format: z.string(),
    redactKeys: z.array(z.string())
  }),
  database: DatabaseConfigSchema,
  api: ApiConfigSchema,
  studio: StudioConfigSchema
});
function substituteEnvVars(content) {
  return content.replace(/\$\{([^}]+)\}/g, (_, varName) => {
    const [key, defaultValue] = varName.split(":-");
    const value = process.env[key];
    if (value !== void 0) return value;
    if (defaultValue !== void 0) return defaultValue;
    return "";
  });
}
function loadConfig(configPath) {
  const filePath = configPath || path.resolve(__dirname, "../config/settings.yaml");
  if (!fs.existsSync(filePath)) {
    throw new Error(`Configuration file not found at: ${filePath}`);
  }
  const rawContent = fs.readFileSync(filePath, "utf-8");
  const substitutedContent = substituteEnvVars(rawContent);
  const parsedConfig = yaml.load(substitutedContent);
  const result = AppConfigSchema.safeParse(parsedConfig);
  if (!result.success) {
    console.error("\u274C Configuration Validation Failed:");
    const issues = result.error.errors || result.error.issues || [];
    issues.forEach((err) => {
      console.error(`   - Path: ${err.path.join(".")} | Message: ${err.message}`);
    });
    throw new Error("Invalid Configuration");
  }
  return result.data;
}
var config = loadConfig();

export {
  loadConfig,
  config
};
