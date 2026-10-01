const ALLOWED_HOSTS = {
  walmart: new Set(['walmart.com','www.walmart.com']),
  amazon: new Set(['amazon.com','www.amazon.com']),
  bestbuy: new Set(['bestbuy.com','www.bestbuy.com']),
  ebay: new Set(['ebay.com','www.ebay.com'])
};

const clean = (value, max) => String(value ?? '').trim().toLowerCase().slice(0, max);

const hostFromHttps = value => {
  const match = /^https:\/\/([^\/?#]+)(?:[\/?#]|$)/i.exec(String(value ?? '').trim());
  return match ? match[1].toLowerCase() : null;
};

async function handler(ctx) {
  const retailer = clean(ctx.request.params?.retailer, 30);
  const productId = clean(ctx.request.params?.product, 100);
  const product = ctx.modules.dropradar.PRODUCTS.find(item => item.id === productId);
  const allowed = ALLOWED_HOSTS[retailer];

  if (!product || !allowed) {
    return { status: 404, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify({ error: 'link_unavailable' }) };
  }

  const row = await ctx.data.get('retailer_links', `${retailer}:${productId}`);
  if (!row || row.status !== 'ACTIVE' || !row.url) {
    return { status: 404, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify({ error: 'link_unavailable' }) };
  }

  const host = hostFromHttps(row.url);
  if (!host || !allowed.has(host)) {
    console.error('retailer_link_rejected', JSON.stringify({ retailer, productId, reason: 'host_not_allowed' }));
    return { status: 400, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify({ error: 'invalid_retailer_link' }) };
  }

  await ctx.track('growth_retailer_click', {
    retailer,
    productId,
    affiliate: Boolean(row.affiliateEnabled),
    program: String(row.program ?? '').slice(0, 60)
  });

  return {
    status: 302,
    headers: {
      location: row.url,
      'cache-control': 'no-store',
      'referrer-policy': 'no-referrer'
    },
    body: ''
  };
}
