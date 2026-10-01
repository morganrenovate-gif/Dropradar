const EVENTS = new Set(['product_view','search','discord_cta_click','watch_intent']);

const clean = (value, max) => String(value ?? '').trim().slice(0, max);

async function handler(ctx) {
  let payload;
  try {
    payload = JSON.parse(ctx.request.body || '{}');
  } catch {
    return { status: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'invalid_json' }) };
  }

  const event = clean(payload.event, 40);
  if (!EVENTS.has(event)) {
    return { status: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'unsupported_event' }) };
  }

  const productId = clean(payload.productId, 80);
  const query = clean(payload.query, 80);
  const ref = clean(payload.ref, 120);
  const path = clean(payload.path, 160);

  const properties = {};
  if (productId) properties.productId = productId;
  if (query) properties.query = query;
  if (ref) properties.ref = ref;
  if (path) properties.path = path;

  await ctx.track(`growth_${event}`, properties);
  return { status: 204, headers: { 'cache-control': 'no-store' }, body: '' };
}
