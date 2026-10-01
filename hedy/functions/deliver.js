async function handler(ctx) {
  const api = ctx.modules.dropradar;
  const token = await ctx.secrets.get('DISCORD_BOT_TOKEN');
  if (!token) throw new Error('DISCORD_BOT_TOKEN is required');
  const result = { claimed: 0, sent: 0, failed: 0 };
  for (const candidate of await api.deliveryCandidates(ctx.data, new Date())) {
    const claim = await api.claimDelivery(ctx.data, candidate, new Date());
    if (!claim) continue;
    result.claimed++;
    try {
      const headers = { authorization: `Bot ${token}`, 'content-type': 'application/json' };
      const channelResponse = await ctx.http.fetch('https://discord.com/api/v10/users/@me/channels', { method: 'POST', headers, body: JSON.stringify({ recipient_id: claim.userId }) });
      if (!channelResponse.ok) throw new Error(`Discord channel request failed (${channelResponse.status})`);
      const channel = await channelResponse.json();
      const observation = claim.alert.observation;
      const price = observation.price == null ? 'price unavailable' : `${Number(observation.price).toFixed(2)} ${observation.currency || 'USD'}`;
      const sourceLabel = observation.evidence?.provenance || observation.source;
      const content = `DropRadar alert: ${claim.alert.productId}\n${sourceLabel}: ${price} (${observation.state})\nObserved ${observation.observedAt}. Offer/asking price, not a completed sale.`;
      const messageResponse = await ctx.http.fetch(`https://discord.com/api/v10/channels/${encodeURIComponent(channel.id)}/messages`, { method: 'POST', headers, body: JSON.stringify({ content, allowed_mentions: { parse: [] } }) });
      if (!messageResponse.ok) throw new Error(`Discord message request failed (${messageResponse.status})`);
      await api.settleDelivery(ctx.data, claim.id, claim.claimToken, 'SENT', new Date()); result.sent++;
    } catch (error) {
      await api.settleDelivery(ctx.data, claim.id, claim.claimToken, 'PENDING', new Date(), error); result.failed++;
      console.error('alert_delivery_failed', JSON.stringify({ deliveryId: claim.id, message: error.message }));
    }
  }
  console.info('alert_delivery_complete', JSON.stringify(result));
  return { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(result) };
}
