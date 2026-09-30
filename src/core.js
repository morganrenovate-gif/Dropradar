import crypto from 'node:crypto';

export const INVENTORY_STATES = new Set(['IN_STOCK', 'OUT_OF_STOCK', 'UNKNOWN', 'UNAVAILABLE', 'ERROR']);

export function normalizeState(value) {
  const v = String(value ?? '').trim().toLowerCase();
  if (['in_stock', 'instock', 'available', 'true'].includes(v)) return 'IN_STOCK';
  if (['out_of_stock', 'outofstock', 'sold out', 'false'].includes(v)) return 'OUT_OF_STOCK';
  if (['unavailable', 'discontinued', 'not_found'].includes(v)) return 'UNAVAILABLE';
  if (['error', 'failed'].includes(v)) return 'ERROR';
  return 'UNKNOWN';
}

export function mapProduct(products, candidate) {
  if (candidate.productId) return products.find((p) => p.id === candidate.productId) ?? null;
  if (candidate.upc) {
    const matches = products.filter((p) => p.upc === String(candidate.upc));
    return matches.length === 1 ? matches[0] : null;
  }
  return null;
}

export function observationKey(o) {
  return crypto.createHash('sha256').update([o.source, o.sourceItemId, o.observedAt, o.price, o.state].join('|')).digest('hex');
}

export function alertKey(o, previous) {
  return crypto.createHash('sha256').update([o.productId, o.source, previous?.state ?? 'NONE', o.state, previous?.price ?? '', o.price ?? ''].join('|')).digest('hex');
}

export function meaningfulChange(previous, current) {
  if (!previous) return current.state === 'IN_STOCK';
  if (previous.state !== 'IN_STOCK' && current.state === 'IN_STOCK') return true;
  return Number.isFinite(current.price) && Number.isFinite(previous.price) && previous.price > 0 && Math.abs(current.price - previous.price) / previous.price >= 0.05;
}

export function makeObservation(raw, product, now = new Date()) {
  if (!raw.source || !raw.sourceItemId) throw new Error('source and sourceItemId are required');
  if (!raw.observedAt) throw new Error('observedAt is required for replay safety');
  if (!raw.evidence || typeof raw.evidence !== 'object' || Array.isArray(raw.evidence) || !String(raw.evidence.kind ?? '').trim()) throw new Error('evidence kind is required');
  const observedAt = new Date(raw.observedAt);
  if (!Number.isFinite(observedAt.getTime())) throw new Error('observedAt is invalid');
  if (observedAt.getTime() > now.getTime() + 300_000) throw new Error('observedAt is in the future');
  const price = raw.price == null ? null : Number(raw.price);
  if (price !== null && (!Number.isFinite(price) || price < 0)) throw new Error('invalid price');
  return {
    productId: product.id, source: raw.source, sourceItemId: String(raw.sourceItemId),
    observedAt: observedAt.toISOString(),
    price, currency: raw.currency ?? 'USD', state: normalizeState(raw.state), url: raw.url ?? null,
    evidence: raw.evidence ?? {}, adapterVersion: raw.adapterVersion ?? '1'
  };
}

export async function withRetry(operation, { attempts = 3, delayMs = 25, onRetry = () => {} } = {}) {
  let error;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try { return await operation(attempt); } catch (e) {
      error = e;
      if (attempt < attempts) { onRetry({ attempt, error: e }); await new Promise((r) => setTimeout(r, delayMs * attempt)); }
    }
  }
  throw error;
}
