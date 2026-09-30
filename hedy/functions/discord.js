async function handler(ctx) {
  const api = ctx.modules.dropradar;
  const request = ctx.request;
  const body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? {});
  if (body.length > 65536) return { status: 413, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'payload_too_large' }) };
  const signature = request.headers?.['x-signature-ed25519'];
  const timestamp = request.headers?.['x-signature-timestamp'];
  const publicKey = await ctx.secrets.get('DISCORD_PUBLIC_KEY');
  const timely = timestamp && Math.abs(Date.now() / 1000 - Number(timestamp)) <= 300;
  const hex = value => { if (!/^[0-9a-f]+$/i.test(value) || value.length % 2) return null; const bytes = new Uint8Array(value.length / 2); for (let index = 0; index < bytes.length; index++) bytes[index] = parseInt(value.slice(index * 2, index * 2 + 2), 16); return bytes; };
  const utf8 = value => { const bytes = []; for (const character of value) { const point = character.codePointAt(0); if (point < 128) bytes.push(point); else if (point < 2048) bytes.push(192 | point >> 6, 128 | point & 63); else if (point < 65536) bytes.push(224 | point >> 12, 128 | point >> 6 & 63, 128 | point & 63); else bytes.push(240 | point >> 18, 128 | point >> 12 & 63, 128 | point >> 6 & 63, 128 | point & 63); } return new Uint8Array(bytes); };
  const signatureBytes = signature ? hex(signature) : null, keyBytes = publicKey ? hex(publicKey) : null;
  const valid = signatureBytes && keyBytes && timely && ctx.modules.tweetnacl.sign.detached.verify(utf8(timestamp + body), signatureBytes, keyBytes);
  if (!valid) return { status: 401, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'invalid_signature' }) };
  try {
    const payload = JSON.parse(body);
    if (payload.type === 1) return { status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 1 }) };
    const name = payload.data?.name, query = api.clean(payload.data?.options?.[0]?.value), userId = api.clean(payload.member?.user?.id ?? payload.user?.id);
    const matches = api.PRODUCTS.filter(product => `${product.name} ${product.set}`.toLowerCase().includes(query.toLowerCase()));
    let response;
    if (matches.length !== 1) response = { type: 4, data: { flags: 64, content: matches.length ? 'Please be more specific.' : 'Product not found.' } };
    else {
      const product = matches[0];
      if (name === 'watch') { await api.watch(ctx.data, userId, product.id); response = { type: 4, data: { flags: 64, content: `Watching ${product.name}.` } }; }
      else if (name === 'unwatch') { await api.unwatch(ctx.data, userId, product.id); response = { type: 4, data: { flags: 64, content: `No longer watching ${product.name}.` } }; }
      else if (name === 'value') { const view = await api.productView(ctx.data, product); const lines = view.current.length ? view.current.map(o => `${o.source}: ${o.price == null ? 'price unavailable' : `$${o.price.toFixed(2)} ${o.currency}`} (${o.state}, observed ${o.observedAt})`) : ['No current source observations.']; response = { type: 4, data: { content: `**${product.name}**\n${lines.join('\n')}\nObserved offers are asking prices, not completed sales.` } }; }
      else response = { type: 4, data: { flags: 64, content: 'Unsupported command.' } };
    }
    return { status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(response) };
  } catch (error) { console.error('discord_request_failed', error.message); return { status: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'invalid_request' }) }; }
}
