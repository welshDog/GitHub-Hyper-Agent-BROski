import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import dotenv from 'dotenv';
import { z } from 'zod';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env file
dotenv.config();

// -----------------------------------------------------------------------------
// 1. Validation Schema (Zod)
// -----------------------------------------------------------------------------
const StudioConfigSchema = z.object({
  hardware: z.object({
    microphone: z.object({
      recommended: z.array(z.string()),
      filters: z.array(z.string()),
      interface: z.string(),
    }),
    camera: z.object({
      resolution: z.string(),
      framing: z.string(),
    }),
    screen: z.object({
      resolution: z.string(),
      aspectRatio: z.string(),
    }),
  }),
  software: z.object({
    ide: z.string(),
    theme: z.string(),
    font: z.object({
      family: z.string(),
      ligatures: z.boolean(),
      size: z.object({
        editor: z.number().min(16).max(24),
        terminal: z.number().min(16).max(24),
      }),
    }),
    ui: z.object({
      hideActivityBar: z.boolean(),
      hideMinimap: z.boolean(),
      cursorBlinking: z.string(),
      screencastMode: z.boolean(),
    }),
  }),
  recording: z.object({
    obs: z.object({
      canvas: z.string(),
      fps: z.number(),
      bitrateKbps: z.number(),
      audioFilters: z.array(z.string()),
    }),
  }),
  project: z.object({
    branching: z.object({
      main: z.string(),
      starter: z.string(),
      checkpoints: z.array(z.string()),
    }),
    hygiene: z.object({
      linter: z.string(),
      formatter: z.string(),
    }),
  }),
});

const DatabaseConfigSchema = z.object({
  host: z.string(),
  port: z.coerce.number(),
  username: z.string().min(1, "DB_USER is required"),
  password: z.string().min(1, "DB_PASS is required"),
  name: z.string(),
  pool: z.object({
    min: z.number(),
    max: z.number(),
  }),
  ssl: z.union([z.boolean(), z.string().transform(val => val === 'true')]),
});

const ApiConfigSchema = z.object({
  baseUrl: z.string().url(),
  timeoutMs: z.number(),
  retryAttempts: z.number(),
  services: z.record(z.string(), z.object({
    url: z.string().url(),
    apiKey: z.string().optional(),
    publicKey: z.string().optional(),
  })),
});

export const AppConfigSchema = z.object({
  env: z.enum(['development', 'staging', 'production', 'test']),
  port: z.coerce.number(),
  serviceName: z.string(),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    format: z.string(),
    redactKeys: z.array(z.string()),
  }),
  database: DatabaseConfigSchema,
  api: ApiConfigSchema,
  studio: StudioConfigSchema,
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

// -----------------------------------------------------------------------------
// 2. Variable Substitution Helper
// -----------------------------------------------------------------------------
function substituteEnvVars(content: string): string {
  return content.replace(/\$\{([^}]+)\}/g, (_, varName) => {
    // Check for default value syntax: ${VAR:-default}
    const [key, defaultValue] = varName.split(':-');
    const value = process.env[key];
    
    if (value !== undefined) return value;
    if (defaultValue !== undefined) return defaultValue;
    
    // If it's a critical secret, we might want to throw, 
    // but Zod will catch missing required fields later.
    return ''; 
  });
}

// -----------------------------------------------------------------------------
// 3. Configuration Loader
// -----------------------------------------------------------------------------
export function loadConfig(configPath?: string): AppConfig {
  const filePath = configPath || path.resolve(__dirname, '../config/settings.yaml');
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Configuration file not found at: ${filePath}`);
  }

  // 1. Read raw YAML
  const rawContent = fs.readFileSync(filePath, 'utf-8');

  // 2. Substitute Environment Variables
  const substitutedContent = substituteEnvVars(rawContent);

  // 3. Parse YAML
  const parsedConfig = yaml.load(substitutedContent);

  // 4. Validate with Zod
  const result = AppConfigSchema.safeParse(parsedConfig);

  if (!result.success) {
    console.error("❌ Configuration Validation Failed:");
    // In some Zod versions, .errors is the way, in others it might be .issues
    // We cast to any to bypass the TS check if the type definition is misbehaving
    const issues = (result.error as any).errors || (result.error as any).issues || [];
    issues.forEach((err: any) => {
      console.error(`   - Path: ${err.path.join('.')} | Message: ${err.message}`);
    });
    throw new Error("Invalid Configuration");
  }

  return result.data;
}

// Singleton instance for easy access
export const config = loadConfig();
