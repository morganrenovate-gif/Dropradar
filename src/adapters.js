export class SyntheticAdapter {
  constructor(name, observations = [], error = null) { this.name = name; this.observations = observations; this.error = error; this.synthetic = true; }
  async collect() { if (this.error) throw this.error; return structuredClone(this.observations); }
}

export class FailedAdapter {
  constructor(name, error) { this.name = name; this.error = error; }
  async collect() { throw this.error; }
}

// Compliant catalog substitutes expose source-attributed metadata snapshots. They never
// claim live retailer inventory, and are deliberately UNKNOWN unless a permitted feed says otherwise.
export class CatalogSnapshotAdapter {
  constructor(name, items) { this.name = name; this.items = items; }
  async collect() { return this.items.map((x) => ({ ...x, source: this.name, state: x.state ?? 'UNKNOWN', adapterVersion: 'catalog-snapshot-v1' })); }
}
