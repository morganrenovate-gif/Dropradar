const SOURCE = 'pokemontcgapi-sealed';
const MAPPINGS = 'source_mappings';
const MAX_PRODUCTS = 10;

const normalized = value => String(value ?? '')
  .toLowerCase()
  .replace(/pok[eé]mon/g, ' ')
  .replace(/display/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const kindFor = product => {
  if (product.id.includes('etb')) return 'ETB';
  if (product.id.includes('booster-bundle')) return 'BOOSTER_BUNDLE';
  if (product.id.includes('booster-box')) return 'BOOSTER_BOX';
  if (product.id.includes('premium')) return 'PREMIUM_COLLECTION';
  return null;
};

const scoreCandidate = (product, candidate) => {
  const productName = normalized(product.name);
  const candidateName = normalized(candidate.name);
  const productTokens = productName.split(' ').filter(Boolean);
  const candidateTokens = new Set(candidateName.split(' ').filter(Boolean));
  const coverage = productTokens.length ? productTokens.filter(token => candidateTokens.has(token)).length / productTokens.length : 0;
  let score = coverage;
  if (candidateName === productName) score += 0.5;
  const expectedKind = kindFor(product);
  if (expectedKind && candidate.kind === expectedKind) score += 0.25;
  const setName = normalized(product.set);
  if (setName && normalized(candidate.set_name).includes(setName)) score += 0.2;
  if (!productName.includes('pokemon center') && candidateName.includes('pokemon center')) score -= 0.5;
  if (!productName.includes('case') && candidateName.includes('case')) score -= 0.4;
  return score;
};

async function fetchJson(ctx, url, apiKey) {
  const response = await ctx.http.fetch(url, {
    method: 'GET',
    headers: { 'X-Api-Key': apiKey },
    timeoutMs: 5000
  });
  let payload = null;
  try { payload = await response.json(); } catch {}
  if (!response.ok) {
    const code = payload?.error?.code || `HTTP_${response.status}`;
    const error = new Error(`Pokémon TCG API request failed (${response.status}:${code})`);
    error.status = response.status;
    error.code = code;
    throw error;
  }
  return payload;
}

async function resolveMapping(ctx, api, product, apiKey) {
  const key = `${SOURCE}:${product.id}`;
  const cached = await ctx.data.get(MAPPINGS, key);
  if (cached?.externalId) return cached;

  const expectedKind = kindFor(product);
  const query = `q=${encodeURIComponent(product.name)}&limit=10${expectedKind ? `&kind=${encodeURIComponent(expectedKind)}` : ''}`;
  const payload = await fetchJson(ctx, `https://api.pokemontcgapi.com/v1/sealed?${query}`, apiKey);
  const candidates = Array.isArray(payload?.data) ? payload.data : [];
  const ranked = candidates
    .map(candidate => ({ candidate, score: scoreCandidate(product, candidate) }))
    .sort((a, b) => b.score - a.score || String(a.candidate.id).localeCompare(String(b.candidate.id)));

  if (!ranked.length || ranked[0].score < 0.75 || (ranked[1] && ranked[0].score - ranked[1].score < 0.1)) {
    throw new Error(`No unambiguous sealed-product mapping for ${product.id}`);
  }

  const selected = ranked[0].candidate;
  const mapping = {
    source: SOURCE,
    productId: product.id,
    externalId: selected.id,
    externalName: selected.name,
    externalKind: selected.kind ?? null,
    externalSet: selected.set_name ?? null,
    mappedAt: new Date().toISOString(),
    score: ranked[0].score
  };
  await ctx.data.put(MAPPINGS, key, mapping);
  return mapping;
}

const quoteScore = quote => {
  let score = 0;
  if (quote.currency === 'USD') score += 100;
  if (quote.source === 'TCGPLAYER') score += 60;
  if (quote.basis === 'GUIDE') score += 25;
  if (quote.basis === 'ASKING') score += 15;
  if (quote.variant === 'MARKET') score += 15;
  if (quote.variant === 'LOW') score += 10;
  if (quote.locale === 'en') score += 5;
  return score;
};

const observedAt = value => {
  const text = String(value ?? '').trim();
  if (!text) throw new Error('Price quote is missing as_of');
  const parsed = new Date(text.includes('T') ? text : `${text}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime())) throw new Error('Price quote has invalid as_of');
  return parsed.toISOString();
};

function pickQuote(payload) {
  const quotes = Array.isArray(payload?.data?.quotes) ? payload.data.quotes : [];
  const usable = quotes.filter(quote =>
    Number.isFinite(Number(quote.amount)) &&
    Number(quote.amount) >= 0 &&
    quote.source &&
    quote.basis &&
    quote.variant &&
    quote.currency &&
    quote.as_of &&
    quote.provenance
  );
  usable.sort((a, b) => quoteScore(b) - quoteScore(a) || String(a.source).localeCompare(String(b.source)));
  if (!usable.length) throw new Error('No usable sealed-product price quote');
  return usable[0];
}

async function handler(ctx) {
  const api = ctx.modules.dropradar;
  const startedAt = new Date();
  const apiKey = await ctx.secrets.get('POKEMONTCG_API_KEY');
  if (!apiKey) {
    const health = { source: SOURCE, status: 'UNCONFIGURED', startedAt: startedAt.toISOString(), completedAt: new Date().toISOString(), itemCount: 0, rejectedCount: 0, error: 'POKEMONTCG_API_KEY is not configured' };
    await ctx.data.put(api.C.health, SOURCE, health);
    return { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ source: SOURCE, status: health.status, observations: 0, alerts: 0, rejected: 0 }) };
  }

  const watches = api.values(await ctx.data.list(api.C.watches, { limit: 1000 }));
  const productIds = [...new Set(watches.map(watch => watch.productId).filter(Boolean))].sort().slice(0, MAX_PRODUCTS);
  const products = productIds.map(id => api.PRODUCTS.find(product => product.id === id)).filter(Boolean);
  if (!products.length) {
    const health = { source: SOURCE, status: 'HEALTHY', startedAt: startedAt.toISOString(), completedAt: new Date().toISOString(), itemCount: 0, rejectedCount: 0, error: null, note: 'no watched products' };
    await ctx.data.put(api.C.health, SOURCE, health);
    return { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ source: SOURCE, status: health.status, observations: 0, alerts: 0, rejected: 0 }) };
  }

  let observations = 0, alerts = 0, rejected = 0;
  const errors = [];
  for (const product of products) {
    try {
      const mapping = await resolveMapping(ctx, api, product, apiKey);
      const payload = await fetchJson(ctx, `https://api.pokemontcgapi.com/v1/sealed/${encodeURIComponent(mapping.externalId)}/prices`, apiKey);
      const quote = pickQuote(payload);
      const completedAt = new Date().toISOString();
      const health = { source: SOURCE, status: 'HEALTHY', startedAt: startedAt.toISOString(), completedAt, itemCount: products.length, rejectedCount: rejected, error: null };
      const raw = {
        source: `pokemontcgapi-${String(quote.source).toLowerCase()}`,
        sourceItemId: `${mapping.externalId}:${quote.source}:${quote.variant}:${quote.locale ?? 'any'}`,
        observedAt: observedAt(quote.as_of),
        price: Number(quote.amount),
        currency: quote.currency,
        state: 'unknown',
        url: 'https://pokemontcgapi.com/docs/api/prices/current-sealed',
        evidence: {
          kind: 'market_price_observation',
          provider: 'pokemontcgapi.com',
          upstreamSource: quote.source,
          provenance: quote.provenance,
          basis: quote.basis,
          variant: quote.variant,
          locale: quote.locale ?? null,
          asOf: quote.as_of,
          sampleN: quote.sample_n ?? null,
          delayedHours: payload?.meta?.delayed_hours ?? null,
          externalProductId: mapping.externalId,
          externalProductName: mapping.externalName
        },
        adapterVersion: 'pokemontcgapi-sealed-v1'
      };
      const observation = api.makeObservation(raw, product, new Date());
      const saved = await api.commitObservation(ctx, observation, health);
      if (saved.inserted) observations++;
      if (saved.alerted) alerts++;
    } catch (error) {
      rejected++;
      errors.push({ productId: product.id, message: String(error.message || error).slice(0, 300) });
      if ([401, 403, 429].includes(error.status)) break;
    }
  }

  const completedAt = new Date().toISOString();
  const health = {
    source: SOURCE,
    status: rejected ? 'DEGRADED' : 'HEALTHY',
    startedAt: startedAt.toISOString(),
    completedAt,
    itemCount: products.length,
    rejectedCount: rejected,
    error: errors.length ? errors.map(error => `${error.productId}: ${error.message}`).join('; ').slice(0, 500) : null
  };
  await ctx.data.put(api.C.health, SOURCE, health);
  console.info('pokemontcg_collection_complete', JSON.stringify({ status: health.status, products: products.length, observations, alerts, rejected }));
  return { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ source: SOURCE, status: health.status, products: products.length, observations, alerts, rejected }) };
}
