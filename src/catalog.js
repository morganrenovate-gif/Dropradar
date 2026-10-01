import fs from 'node:fs';

export const products = JSON.parse(fs.readFileSync(new URL('../data/products.json', import.meta.url)));

export function clean(value, max = 100) {
  return String(value ?? '').trim().slice(0, max);
}

export function findProducts(query = '') {
  const q = clean(query).toLowerCase();
  return products.filter((product) => !q || `${product.name} ${product.set}`.toLowerCase().includes(q));
}
