async function handler(ctx) {
  const api = ctx.modules.dropradar;
  const query = api.clean(ctx.request.query?.q).toLowerCase();
  const matches = api.PRODUCTS.filter(product => !query || `${product.name} ${product.set}`.toLowerCase().includes(query));
  return { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, body: JSON.stringify(await Promise.all(matches.map(product => api.productView(ctx.data, product)))) };
}
