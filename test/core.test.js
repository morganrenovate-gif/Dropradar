import test from 'node:test';
import assert from 'node:assert/strict';
import { makeObservation, mapProduct, meaningfulChange, normalizeState, withRetry } from '../src/core.js';

test('normalizes known and unknown inventory states', () => {
  assert.equal(normalizeState('available'), 'IN_STOCK'); assert.equal(normalizeState('sold out'), 'OUT_OF_STOCK'); assert.equal(normalizeState('unexpected'), 'UNKNOWN');
});
test('rejects missing provenance kind and future timestamps', () => {
  const product = { id: 'p1' }; const raw = { source: 's', sourceItemId: 'i', observedAt: '2026-01-01T00:00:00Z', evidence: {}, state: 'available' };
  assert.throws(() => makeObservation(raw, product, new Date('2026-01-01T00:00:00Z')), /evidence kind/);
  assert.throws(() => makeObservation({ ...raw, evidence: { kind: 'fixture' }, observedAt: '2026-01-02T00:00:00Z' }, product, new Date('2026-01-01T00:00:00Z')), /future/);
});
test('mapping requires a unique strong identifier and fails closed', () => {
  const products = [{ id: 'a', upc: '1' }, { id: 'b', upc: '2' }];
  assert.equal(mapProduct(products, { upc: '1' }).id, 'a'); assert.equal(mapProduct(products, { name: 'similar text' }), null); assert.equal(mapProduct(products, { productId: 'missing' }), null);
});
test('detects stock transition and 5 percent price changes', () => {
  assert.equal(meaningfulChange({ state: 'OUT_OF_STOCK', price: 10 }, { state: 'IN_STOCK', price: 10 }), true);
  assert.equal(meaningfulChange({ state: 'IN_STOCK', price: 10 }, { state: 'IN_STOCK', price: 10.4 }), false);
  assert.equal(meaningfulChange({ state: 'IN_STOCK', price: 10 }, { state: 'IN_STOCK', price: 10.5 }), true);
});
test('bounded retry records retries and eventually succeeds', async () => {
  let calls = 0; const retries = [];
  const result = await withRetry(() => { calls++; if (calls < 3) throw new Error('no'); return 'yes'; }, { attempts: 3, delayMs: 0, onRetry: (x) => retries.push(x) });
  assert.equal(result, 'yes'); assert.equal(calls, 3); assert.equal(retries.length, 2);
});
