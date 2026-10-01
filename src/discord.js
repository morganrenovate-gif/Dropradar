import crypto from 'node:crypto';
import { clean, products } from './catalog.js';

export function verifyDiscord({ headers, body, publicKey, now = Date.now() }) {
  const signature = headers['x-signature-ed25519'] ?? headers.get?.('x-signature-ed25519');
  const timestamp = headers['x-signature-timestamp'] ?? headers.get?.('x-signature-timestamp');
  if (!signature || !timestamp || !publicKey || Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  try {
    const key = crypto.createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(publicKey, 'hex')]), format: 'der', type: 'spki' });
    return crypto.verify(null, Buffer.from(timestamp + body), key, Buffer.from(signature, 'hex'));
  } catch { return false; }
}

export async function discordCommand(payload, repository) {
  if (payload.type === 1) return { type: 1 };
  const name = payload.data?.name;
  const query = clean(payload.data?.options?.[0]?.value);
  const userId = clean(payload.member?.user?.id ?? payload.user?.id);
  const matches = products.filter((p) => `${p.name} ${p.set}`.toLowerCase().includes(query.toLowerCase()));
  if (matches.length !== 1) return { type: 4, data: { flags: 64, content: matches.length ? 'Please be more specific.' : 'Product not found.' } };
  const product = matches[0];
  if (name === 'watch') { await repository.watch(userId, product.id); return { type: 4, data: { flags: 64, content: `Watching ${product.name}.` } }; }
  if (name === 'unwatch') { await repository.unwatch(userId, product.id); return { type: 4, data: { flags: 64, content: `No longer watching ${product.name}.` } }; }
  if (name === 'value') {
    const observations = await repository.current(product.id);
    const lines = observations.length ? observations.map((o) => `${o.source}: ${o.price == null ? 'price unavailable' : `$${o.price.toFixed(2)} ${o.currency}`} (${o.state}, observed ${o.observedAt})`) : ['No current source observations.'];
    return { type: 4, data: { content: `**${product.name}**\n${lines.join('\n')}\nObserved offers are asking prices, not completed sales.` } };
  }
  return { type: 4, data: { flags: 64, content: 'Unsupported command.' } };
}
