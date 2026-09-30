async function handler(ctx) {
  const api = ctx.modules.dropradar;
  const id = ctx.request.params?.id;
  const product = api.PRODUCTS.find(candidate => candidate.id === id);
  return product
    ? { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, body: JSON.stringify(await api.productView(ctx.data, product)) }
    : { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ error: 'not_found' }) };
}
