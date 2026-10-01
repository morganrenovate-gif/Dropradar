import fs from 'node:fs';
import path from 'node:path';

const EMPTY = { observations: [], current: {}, watches: [], watchRemovals: [], alerts: [], sourceHealth: {}, audit: [] };

export class JsonStore {
  constructor(file = process.env.DATA_FILE ?? 'var/dropradar.json') { this.file = file; this.data = structuredClone(EMPTY); }
  load() { try { this.data = { ...structuredClone(EMPTY), ...JSON.parse(fs.readFileSync(this.file, 'utf8')) }; } catch (e) { if (e.code !== 'ENOENT') throw e; } return this; }
  save({ preserveWatches = false } = {}) {
    const lock = `${this.file}.lock`;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const deadline = Date.now() + 5000;
    while (true) {
      try { fs.mkdirSync(lock); fs.writeFileSync(path.join(lock, 'owner.json'), JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() })); break; } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        try {
          const owner = JSON.parse(fs.readFileSync(path.join(lock, 'owner.json'), 'utf8'));
          try { process.kill(owner.pid, 0); } catch (ownerError) { if (ownerError.code === 'ESRCH') { fs.rmSync(lock, { recursive: true, force: true }); continue; } }
        } catch (ownerReadError) { if (ownerReadError.code !== 'ENOENT' && !(ownerReadError instanceof SyntaxError)) throw ownerReadError; }
        if (Date.now() >= deadline) throw new Error(`timed out acquiring local store lock: ${lock}`);
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
      }
    }
    try {
      let disk = structuredClone(EMPTY); try { disk = { ...disk, ...JSON.parse(fs.readFileSync(this.file, 'utf8')) }; } catch (e) { if (e.code !== 'ENOENT') throw e; }
    const merge = (a, b, key) => [...new Map([...a, ...b].map((x) => [x[key], x])).values()];
    this.data.observations = merge(disk.observations, this.data.observations, 'key');
    this.data.alerts = merge(disk.alerts, this.data.alerts, 'key');
    this.data.audit = merge(disk.audit, this.data.audit, 'at');
    const newestMap = (a, b, field) => Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])].map((key) => {
      const left = a[key], right = b[key]; if (!left) return [key, right]; if (!right) return [key, left];
      return [key, String(left[field] ?? '') > String(right[field] ?? '') ? left : right];
    }));
    this.data.sourceHealth = newestMap(disk.sourceHealth, this.data.sourceHealth, 'completedAt');
    this.data.current = newestMap(disk.current, this.data.current, 'observedAt');
    if (preserveWatches) this.data.watches = disk.watches;
    else {
      this.data.watchRemovals = [...new Set([...disk.watchRemovals, ...this.data.watchRemovals])];
      this.data.watches = [...new Map([...disk.watches, ...this.data.watches].map((w) => [`${w.userId}:${w.productId}`, w])).values()].filter((w) => !this.data.watchRemovals.includes(`${w.userId}:${w.productId}`));
    }
      const tmp = `${this.file}.${process.pid}.tmp`; fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2)); fs.renameSync(tmp, this.file);
    } finally {
      fs.rmSync(lock, { recursive: true, force: true });
    }
  }
  addObservation(observation, key) { if (this.data.observations.some((x) => x.key === key)) return false; this.data.observations.push({ ...observation, key }); this.data.current[`${observation.productId}:${observation.source}`] = observation; return true; }
  watch(userId, productId) { const key = `${userId}:${productId}`; this.data.watchRemovals = this.data.watchRemovals.filter((x) => x !== key); if (!this.data.watches.some((w) => w.userId === userId && w.productId === productId)) this.data.watches.push({ userId, productId, createdAt: new Date().toISOString() }); }
  unwatch(userId, productId) { const before = this.data.watches.length; this.data.watches = this.data.watches.filter((w) => !(w.userId === userId && w.productId === productId)); this.data.watchRemovals.push(`${userId}:${productId}`); return before !== this.data.watches.length; }
}
