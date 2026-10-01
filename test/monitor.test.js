import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SyntheticAdapter } from '../src/adapters.js';
import { runCollection } from '../src/monitor.js';
import { JsonStore } from '../src/store.js';

const products = [{ id: 'p1', name: 'One', upc: '111' }];
const tempStore = () => new JsonStore(path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dropradar-')), 'db.json')).load();
test('preserves history, rejects uncertain mappings, and replay is idempotent', async () => {
  const store = tempStore(); const now = new Date('2026-01-01T00:00:00Z');
  const adapter = new SyntheticAdapter('test', [{ sourceItemId: 'x', upc: '111', observedAt: now, evidence: { kind: 'fixture' }, price: 12, state: 'available' }, { sourceItemId: 'bad', name: 'One', observedAt: now, evidence: { kind: 'fixture' }, price: 2 }]);
  const first = await runCollection({ adapters: [adapter], products, store, now: () => now, retry: { delayMs: 0 }, allowSynthetic: true });
  const second = await runCollection({ adapters: [adapter], products, store, now: () => now, retry: { delayMs: 0 }, allowSynthetic: true });
  assert.deepEqual([first.observations, first.alerts, first.rejectedMappings], [1, 1, 1]); assert.deepEqual([second.observations, second.alerts], [0, 0]); assert.equal(store.data.observations.length, 1); assert.equal(store.data.alerts.length, 1);
});
test('source failure is isolated, bounded, and observable', async () => {
  const store = tempStore(); let attempts = 0;
  const bad = { name: 'bad', collect: async () => { attempts++; throw new Error('timeout'); } };
  const good = new SyntheticAdapter('good', [{ sourceItemId: 'x', productId: 'p1', observedAt: '2026-01-01T00:00:00Z', evidence: { kind: 'fixture' }, price: 1, state: 'out_of_stock' }]);
  const result = await runCollection({ adapters: [bad, good], products, store, retry: { attempts: 2, delayMs: 0 }, allowSynthetic: true });
  assert.equal(attempts, 2); assert.equal(result.sources.bad, 'DEGRADED'); assert.equal(result.sources.good, 'HEALTHY'); assert.match(store.data.sourceHealth.bad.error, /timeout/); assert.equal(store.data.audit.filter((x) => x.type === 'SOURCE_RETRY').length, 1);
});

test('collector save preserves watches written by the long-lived server', async () => {
  const collector = tempStore(); const server = new JsonStore(collector.file).load();
  server.watch('u1', 'p1'); server.save(); collector.data.sourceHealth.test = { status: 'HEALTHY' }; collector.save({ preserveWatches: true });
  assert.equal(new JsonStore(collector.file).load().data.watches.length, 1);
});

test('synthetic adapter cannot publish outside explicit test mode', async () => {
  const store = tempStore(); const adapter = new SyntheticAdapter('fixture', []);
  const result = await runCollection({ adapters: [adapter], products, store, retry: { attempts: 1 } });
  assert.equal(result.sources.fixture, 'DEGRADED'); assert.match(store.data.sourceHealth.fixture.error, /synthetic/);
});

test('stale replicas merge watches and cannot regress newer current state', () => {
  const a = tempStore(), b = new JsonStore(a.file).load();
  a.watch('u1', 'p1'); a.data.current['p1:s'] = { observedAt: '2026-01-02T00:00:00Z', price: 2 }; a.save();
  b.watch('u2', 'p1'); b.data.current['p1:s'] = { observedAt: '2026-01-01T00:00:00Z', price: 1 }; b.save();
  const final = new JsonStore(a.file).load(); assert.deepEqual(final.data.watches.map((w) => w.userId).sort(), ['u1', 'u2']); assert.equal(final.data.current['p1:s'].price, 2);
});
test('watchlists persist and unwatch removes exactly one watch', () => {
  const store = tempStore(); store.watch('u1', 'p1'); store.watch('u1', 'p1'); store.save(); const loaded = new JsonStore(store.file).load();
  assert.equal(loaded.data.watches.length, 1); assert.equal(loaded.unwatch('u1', 'p1'), true); assert.equal(loaded.unwatch('u1', 'p1'), false);
});

test('independent processes cannot lose concurrent local-store writes', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dropradar-process-race-'));
  const file = path.join(directory, 'db.json'); const release = path.join(directory, 'release');
  const { spawn } = await import('node:child_process');
  const launch = (user) => {
    const ready = path.join(directory, `${user}.ready`);
    const child = spawn(process.execPath, [new URL('../test-support/concurrent-writer.js', import.meta.url).pathname, file, ready, release, user], { stdio: ['ignore', 'pipe', 'pipe'] });
    return { child, ready };
  };
  const children = [launch('process-a'), launch('process-b')];
  const deadline = Date.now() + 5000;
  while (!children.every(({ ready }) => fs.existsSync(ready))) { if (Date.now() > deadline) throw new Error('writers did not reach barrier'); await new Promise((resolve) => setTimeout(resolve, 10)); }
  fs.writeFileSync(release, 'go');
  await Promise.all(children.map(({ child }) => new Promise((resolve, reject) => { let stderr = ''; child.stderr.on('data', (chunk) => { stderr += chunk; }); child.on('error', reject); child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(stderr))); })));
  assert.deepEqual(new JsonStore(file).load().data.watches.map((watch) => watch.userId).sort(), ['process-a', 'process-b']);
});

test('local store recovers a lock left by a terminated writer', () => {
  const store = tempStore(); const lock = `${store.file}.lock`;
  fs.mkdirSync(lock); fs.writeFileSync(path.join(lock, 'owner.json'), JSON.stringify({ pid: 2_147_483_647, acquiredAt: '2026-01-01T00:00:00Z' }));
  store.watch('recovered', 'p1'); store.save();
  assert.equal(new JsonStore(store.file).load().data.watches[0].userId, 'recovered'); assert.equal(fs.existsSync(lock), false);
});
