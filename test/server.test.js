import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV = 'test'; process.env.DATA_FILE = `/tmp/dropradar-server-${process.pid}.json`;
const { server, discordCommand } = await import('../src/server.js');

let base;
test.before(async () => { await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());
test('serves responsive app, catalog and detail APIs', async () => {
  const html = await (await fetch(base)).text(); assert.match(html, /Search 30 tracked products/);
  const products = await (await fetch(`${base}/api/products?q=151`)).json(); assert.ok(products.length >= 2);
  const detail = await (await fetch(`${base}/api/products/${products[0].id}`)).json(); assert.equal(detail.id, products[0].id); assert.ok(Array.isArray(detail.history));
});
test('discord commands persist watches, remove them, and attribute values', async () => {
  const payload = (name) => ({ type: 2, data: { name, options: [{ value: 'Scarlet & Violet Elite Trainer Box' }] }, member: { user: { id: '42' } } });
  assert.match((await discordCommand(payload('watch'))).data.content, /Watching/); assert.match((await discordCommand(payload('value'))).data.content, /asking prices/); assert.match((await discordCommand(payload('unwatch'))).data.content, /No longer/);
});
test('discord endpoint rejects unsigned requests', async () => { const response = await fetch(`${base}/api/discord`, { method: 'POST', body: '{}' }); assert.equal(response.status, 401); });
test('unknown routes fail closed', async () => { assert.equal((await fetch(`${base}/..%2Fpackage.json`)).status, 404); });
