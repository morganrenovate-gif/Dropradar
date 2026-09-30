import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const readJson = path => JSON.parse(fs.readFileSync(new URL(`../${path}`, import.meta.url)));
const source = readJson('hedy.app.source.json');
const deploy = readJson('hedy.app.json');
const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('source manifest uses authoritative Hedy identifiers, routes, schedules, and modules', () => {
  assert.deepEqual(source.requiredSecrets, ['DISCORD_PUBLIC_KEY', 'DISCORD_BOT_TOKEN']);
  assert.deepEqual(source.capabilities.outboundHttp.allowedHosts, ['discord.com']);
  for (const collection of source.dataCollections) {
    assert.ok(collection.indexes.length <= 4);
    for (const index of collection.indexes) {
      assert.match(index.name, /^[a-z][a-z0-9-]*$/);
      assert.equal(typeof index.field, 'string');
    }
    assert.equal('access' in collection, false);
  }
  for (const route of source.routes) { assert.equal(route.kind, 'Function'); assert.equal(typeof route.target, 'string'); assert.equal('function' in route, false); }
  for (const schedule of source.schedules) { assert.equal(schedule.kind, 'recurring'); assert.equal(typeof schedule.functionName, 'string'); assert.equal(schedule.timeZone, 'UTC'); }
  const expectedModules = { health: [], products: ['dropradar'], 'product-detail': ['dropradar'], 'discord-webhook': ['dropradar', 'tweetnacl'], 'collect-authorized-imports': ['dropradar'], 'deliver-alerts': ['dropradar'] };
  for (const fn of source.functions) assert.deepEqual(fn.modules, expectedModules[fn.name]);
});

test('deploy manifest is deterministic, self-contained, and exactly hydrated from source', () => {
  assert.equal(deploy.modules.length, source.modules.length);
  assert.equal(deploy.functions.length, source.functions.length);
  for (let index = 0; index < source.modules.length; index++) {
    const definition = source.modules[index], hydrated = deploy.modules[index];
    assert.deepEqual(hydrated, { name: definition.name, code: read(definition.sourcePath) });
  }
  for (let index = 0; index < source.functions.length; index++) {
    const definition = source.functions[index], hydrated = deploy.functions[index];
    const { sourcePath, ...metadata } = definition;
    assert.deepEqual(hydrated, { ...metadata, code: read(sourcePath) });
  }
});

test('sandbox sources avoid unsupported imports, Node globals, transactions, query options, and timers', () => {
  for (const definition of [...source.functions, ...source.modules]) {
    const code = read(definition.sourcePath);
    if (source.functions.includes(definition)) assert.match(code, /async function handler\(ctx\)/);
    else assert.match(code, /module\.exports/);
    assert.doesNotMatch(code, /^\s*import\s|\brequire\s*\(|\bBuffer\b|(?<!\.)\bfetch\s*\(|\bsetTimeout\b|\bsetInterval\b/m);
    assert.doesNotMatch(code, /ctx\.log|ctx\.secrets\.[A-Z_]|ctx\.crypto|ctx\.data\.transaction|tx\.create|\blte\s*:|\bdescending\s*:/);
  }
});

test('frontend API routes target declared functions and no writable store exists', () => {
  const functions = new Set(deploy.functions.map(fn => fn.name));
  for (const route of deploy.routes) assert.ok(functions.has(route.target));
  assert.deepEqual(deploy.runtimeWritablePaths, []);
});
