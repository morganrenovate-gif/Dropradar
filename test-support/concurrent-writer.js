import fs from 'node:fs';
import { JsonStore } from '../src/store.js';

const [file, ready, release, user] = process.argv.slice(2);
const store = new JsonStore(file).load();
store.watch(user, 'p1');
fs.writeFileSync(ready, 'ready');
while (!fs.existsSync(release)) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
store.save();
