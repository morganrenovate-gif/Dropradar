async function handler(ctx) {
  const result = await ctx.data.list('source_health', { limit: 100 });
  const values = (result.items || []).map(row => row.value ?? row.data ?? row);
  return { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, body: JSON.stringify({ status: 'ok', sources: Object.fromEntries(values.map(record => [record.source, record])) }) };
}
