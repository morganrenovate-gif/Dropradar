import { alertKey, makeObservation, mapProduct, meaningfulChange, observationKey, withRetry } from './core.js';

export async function runCollection({ adapters, products, store, now = () => new Date(), retry = {}, allowSynthetic = false }) {
  const result = { sources: {}, observations: 0, alerts: 0, rejectedMappings: 0 };
  for (const adapter of adapters) {
    const startedAt = now().toISOString();
    try {
      const raws = await withRetry(() => adapter.collect(), { ...retry, onRetry: ({ attempt, error }) => {
        store.data.audit.push({ type: 'SOURCE_RETRY', source: adapter.name, attempt, message: error.message, at: now().toISOString() });
      }});
      if (adapter.synthetic && !allowSynthetic) throw new Error('synthetic adapter cannot publish to runtime state');
      for (const raw of raws) {
        const product = mapProduct(products, raw);
        if (!product) { result.rejectedMappings++; store.data.audit.push({ type: 'MAPPING_REJECTED', source: adapter.name, sourceItemId: raw.sourceItemId, at: now().toISOString() }); continue; }
        const observation = makeObservation({ ...raw, source: adapter.name }, product, now());
        const currentKey = `${product.id}:${adapter.name}`;
        const previous = store.data.current[currentKey];
        if (!store.addObservation(observation, observationKey(observation))) continue;
        result.observations++;
        if (meaningfulChange(previous, observation)) {
          const key = alertKey(observation, previous);
          if (!store.data.alerts.some((a) => a.key === key)) {
            store.data.alerts.push({ key, productId: product.id, source: adapter.name, observation, createdAt: now().toISOString(), deliveredTo: [] });
            result.alerts++;
          }
        }
      }
      store.data.sourceHealth[adapter.name] = { status: 'HEALTHY', startedAt, completedAt: now().toISOString(), itemCount: raws.length, error: null };
      result.sources[adapter.name] = 'HEALTHY';
    } catch (error) {
      store.data.sourceHealth[adapter.name] = { status: 'DEGRADED', startedAt, completedAt: now().toISOString(), itemCount: 0, error: error.message };
      result.sources[adapter.name] = 'DEGRADED';
    }
  }
  store.save({ preserveWatches: true });
  return result;
}

export async function deliverPendingAlerts({ store, send }) {
  let delivered = 0;
  for (const alert of store.data.alerts) {
    const watchers = store.data.watches.filter((w) => w.productId === alert.productId);
    for (const watcher of watchers) {
      if (alert.deliveredTo.includes(watcher.userId)) continue;
      await send({ userId: watcher.userId, alert });
      alert.deliveredTo.push(watcher.userId); delivered++; store.save();
    }
  }
  return delivered;
}
