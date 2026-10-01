async function handler(ctx) {
  return { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(await ctx.modules.dropradar.collect(ctx)) };
}
