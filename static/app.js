const grid = document.querySelector('#products');
const search = document.querySelector('#search');
const dialog = document.querySelector('#detail');
const money = (value, currency = 'USD') => value == null ? 'Price unavailable' : new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
const escapeHtml = (s) => String(s).replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const attribution = (observation) => observation?.evidence?.provenance || observation?.source || 'Unknown source';
const track = (event, properties = {}) => {
  fetch('/api/growth', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ event, path: location.pathname, ...properties }),
    keepalive: true
  }).catch(() => {});
};

async function load(q = '') {
  grid.setAttribute('aria-busy', 'true');
  const response = await fetch(`/api/products?q=${encodeURIComponent(q)}`);
  const products = await response.json();
  grid.innerHTML = products.map((p) => `<article class="card"><p class="set">${escapeHtml(p.set)}</p><h2>${escapeHtml(p.name)}</h2><dl><div><dt>MSRP</dt><dd>${money(p.msrp, 'USD')}</dd></div><div><dt>Sources</dt><dd>${p.current.length}</dd></div></dl><button data-id="${p.id}">View evidence</button></article>`).join('') || '<p>No products match your search.</p>';
  grid.removeAttribute('aria-busy');
  if (q.trim()) track('search', { query: q.trim().slice(0, 80) });
}

grid.addEventListener('click', async (event) => {
  const id = event.target.dataset.id; if (!id) return;
  track('product_view', { productId: id });
  const p = await (await fetch(`/api/products/${id}`)).json();
  const observations = p.current.map((o) => `<li><strong>${escapeHtml(attribution(o))}</strong> — ${money(o.price, o.currency || 'USD')} · ${escapeHtml(o.state.replaceAll('_', ' '))}<small>Observed ${new Date(o.observedAt).toLocaleString()} · ${escapeHtml(o.evidence?.basis || 'asking/offer')} price</small></li>`).join('') || '<li>No current observations yet.</li>';
  const history = p.history.map((o) => `<li>${new Date(o.observedAt).toLocaleDateString()} · ${escapeHtml(attribution(o))} · ${money(o.price, o.currency || 'USD')} · ${escapeHtml(o.state)}</li>`).join('') || '<li>Collection history will appear here.</li>';
  dialog.innerHTML = `<button class="close" aria-label="Close">×</button><p class="set">${escapeHtml(p.set)}</p><h2>${escapeHtml(p.name)}</h2><p>UPC ${escapeHtml(p.upc)} · MSRP ${money(p.msrp, 'USD')}</p><h3>Current source observations</h3><ul>${observations}</ul><h3>Recent history</h3><ul>${history}</ul><a class="watch" data-product-id="${p.id}" href="https://discord.com/" rel="noopener">Watch in Discord</a>`;
  dialog.querySelector('.close').onclick = () => dialog.close();
  dialog.querySelector('.watch').onclick = () => track('discord_cta_click', { productId: p.id });
  dialog.showModal();
});
let timer; search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => load(search.value), 150); });
load().catch(() => { grid.innerHTML = '<p>Product data is temporarily unavailable.</p>'; });
