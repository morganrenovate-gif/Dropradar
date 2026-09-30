const grid = document.querySelector('#products');
const search = document.querySelector('#search');
const dialog = document.querySelector('#detail');
const money = (value) => value == null ? 'Price unavailable' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const escapeHtml = (s) => String(s).replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

async function load(q = '') {
  grid.setAttribute('aria-busy', 'true');
  const response = await fetch(`/api/products?q=${encodeURIComponent(q)}`);
  const products = await response.json();
  grid.innerHTML = products.map((p) => `<article class="card"><p class="set">${escapeHtml(p.set)}</p><h2>${escapeHtml(p.name)}</h2><dl><div><dt>MSRP</dt><dd>${money(p.msrp)}</dd></div><div><dt>Sources</dt><dd>${p.current.length}</dd></div></dl><button data-id="${p.id}">View evidence</button></article>`).join('') || '<p>No products match your search.</p>';
  grid.removeAttribute('aria-busy');
}

grid.addEventListener('click', async (event) => {
  const id = event.target.dataset.id; if (!id) return;
  const p = await (await fetch(`/api/products/${id}`)).json();
  const observations = p.current.map((o) => `<li><strong>${escapeHtml(o.source)}</strong> — ${money(o.price)} · ${escapeHtml(o.state.replaceAll('_', ' '))}<small>Observed ${new Date(o.observedAt).toLocaleString()} · asking/offer price</small></li>`).join('') || '<li>No current observations yet.</li>';
  const history = p.history.map((o) => `<li>${new Date(o.observedAt).toLocaleDateString()} · ${escapeHtml(o.source)} · ${money(o.price)} · ${escapeHtml(o.state)}</li>`).join('') || '<li>Collection history will appear here.</li>';
  dialog.innerHTML = `<button class="close" aria-label="Close">×</button><p class="set">${escapeHtml(p.set)}</p><h2>${escapeHtml(p.name)}</h2><p>UPC ${escapeHtml(p.upc)} · MSRP ${money(p.msrp)}</p><h3>Current source observations</h3><ul>${observations}</ul><h3>Recent history</h3><ul>${history}</ul><a class="watch" href="https://discord.com/" rel="noopener">Watch in Discord</a>`;
  dialog.querySelector('.close').onclick = () => dialog.close(); dialog.showModal();
});
let timer; search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => load(search.value), 150); });
load().catch(() => { grid.innerHTML = '<p>Product data is temporarily unavailable.</p>'; });
