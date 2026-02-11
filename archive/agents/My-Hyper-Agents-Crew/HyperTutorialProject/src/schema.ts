import fs from 'fs';
import path from 'path';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AppConfigSchema } from './config.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function generateSchema() {
  const schema = zodToJsonSchema(AppConfigSchema as any, 'AppConfig');
  const outDir = path.resolve(__dirname, '../dist/schema');
  const outFile = path.join(outDir, 'app-config.json');

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(schema, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateSchema();
}
