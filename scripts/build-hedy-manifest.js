import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'hedy.app.source.json');
const outputPath = path.join(root, 'hedy.app.json');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const readCode = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8').replace(/\r\n/g, '\n');
const hydrate = (definition) => {
  if (!definition.sourcePath) throw new Error(`Missing sourcePath for ${definition.name}`);
  const { sourcePath: relativePath, ...manifestDefinition } = definition;
  return { ...manifestDefinition, code: readCode(relativePath) };
};
const manifest = {
  ...source,
  modules: source.modules.map(hydrate),
  functions: source.functions.map(hydrate)
};
const rendered = `${JSON.stringify(manifest, null, 2)}\n`;
if (process.argv.includes('--check')) {
  const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (existing !== rendered) {
    console.error('hedy.app.json is stale; run npm run build:hedy');
    process.exitCode = 1;
  }
} else {
  fs.writeFileSync(outputPath, rendered);
  console.log(`built ${path.relative(root, outputPath)}`);
}
