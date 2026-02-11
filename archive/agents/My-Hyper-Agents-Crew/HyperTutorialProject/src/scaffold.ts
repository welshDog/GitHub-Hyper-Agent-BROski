#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function main() {
  const { name } = await inquirer.prompt([
    { name: 'name', message: 'Module name', type: 'input', validate: v => v ? true : 'Required' },
  ]);

  const moduleDir = path.resolve(__dirname, `./modules/${name}`);
  const testDir = path.resolve(__dirname, '../tests');
  const docsDir = path.resolve(__dirname, '../docs/api');

  fs.mkdirSync(moduleDir, { recursive: true });
  fs.mkdirSync(testDir, { recursive: true });
  fs.mkdirSync(docsDir, { recursive: true });

  const apiFile = path.join(moduleDir, 'index.ts');
  const testFile = path.join(testDir, `${name}.test.ts`);
  const docFile = path.join(docsDir, `${name}.md`);

  const apiSource = [
    `export type ${capitalize(name)}Input = {}`,
    `export type ${capitalize(name)}Output = { ok: boolean }`,
    `export async function ${camel(name)}(input: ${capitalize(name)}Input): Promise<${capitalize(name)}Output> {`,
    `  return { ok: true }`,
    `}`,
  ].join('\n');

  const testSource = [
    `import { ${camel(name)} } from '../src/modules/${name}/index.js'`,
    `test('${name} works', async () => {`,
    `  const res = await ${camel(name)}({});`,
    `  expect(res.ok).toBe(true);`,
    `})`,
  ].join('\n');

  const docContent = [
    `# ${name}`,
    ``,
    `API: ${camel(name)}(input) => output`,
  ].join('\n');

  if (!fs.existsSync(apiFile)) fs.writeFileSync(apiFile, apiSource);
  if (!fs.existsSync(testFile)) fs.writeFileSync(testFile, testSource);
  if (!fs.existsSync(docFile)) fs.writeFileSync(docFile, docContent);
}

function camel(s: string) {
  return s.replace(/[-_ ]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase()).replace(/^[A-Z]/, m => m.toLowerCase());
}
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(() => process.exit(1));
}
