import fs from 'node:fs';
import { CatalogSnapshotAdapter, FailedAdapter } from './adapters.js';
import { runCollection } from './monitor.js';
import { JsonStore } from './store.js';

const products = JSON.parse(fs.readFileSync(new URL('../data/products.json', import.meta.url)));
const importFile = (file, source) => { try { return new CatalogSnapshotAdapter(source, JSON.parse(fs.readFileSync(file))); } catch (e) { return new FailedAdapter(source, new Error(`import unavailable: ${e.message}`)); } };
const adapters = [
  importFile(process.env.POKEMON_CATALOG_IMPORT ?? 'imports/pokemon-catalog.json', 'pokemon-catalog'),
  importFile(process.env.EBAY_AUTHORIZED_IMPORT ?? 'imports/ebay-authorized.json', 'ebay-authorized'),
  importFile(process.env.BESTBUY_AUTHORIZED_IMPORT ?? 'imports/bestbuy-authorized.json', 'bestbuy-authorized')
];
const result = await runCollection({ adapters, products, store: new JsonStore().load() });
console.log(JSON.stringify({ event: 'collection_complete', ...result }));
