import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const api = require('../hedy/modules/dropradar.cjs');
export const tweetnacl = require('../hedy/modules/tweetnacl.cjs');
const indexes = {
  'by-source': { field: 'source', sortField: 'observedAt' },
  'by-product': { field: 'productId', sortField: 'observedAt' },
  'by-user': { field: 'userId', sortField: 'updatedAt' },
  'by-alert': { field: 'alertId' },
  'by-status-updated': { field: 'status', sortField: 'updatedAt' },
  'by-status-lease': { field: 'status', sortField: 'leaseUntil' }
};
const clone = value => value == null ? value : structuredClone(value);
const conflict = message => Object.assign(new Error(message), { code: 'PRECONDITION_FAILED', status: 409 });

export class MemoryHedyData {
  constructor() { this.collections = new Map(); this.versions = new Map(); }
  collection(name) { if (!this.collections.has(name)) this.collections.set(name, new Map()); return this.collections.get(name); }
  versionKey(name,key){ return `${name}\0${key}`; }
  async get(name,key){ return clone(this.collection(name).get(key) ?? null); }
  async getWithMeta(name,key){ const value=this.collection(name).get(key); return value===undefined?null:{ value:clone(value), version:this.versions.get(this.versionKey(name,key)) }; }
  async put(name,key,value,options={}){ const collection=this.collection(name), exists=collection.has(key), version=this.versions.get(this.versionKey(name,key)); if(options.ifNotExists&&exists)throw conflict('item already exists'); if(options.ifVersion!==undefined&&(!exists||version!==options.ifVersion))throw conflict('version conflict'); collection.set(key,clone(value)); this.versions.set(this.versionKey(name,key),(version??0)+1); return { version:(version??0)+1 }; }
  async delete(name,key,options={}){ const version=this.versions.get(this.versionKey(name,key)); if(options.ifVersion!==undefined&&version!==options.ifVersion)throw conflict('version conflict'); this.collection(name).delete(key); this.versions.delete(this.versionKey(name,key)); }
  async list(name,options={}){ let rows=[...this.collection(name)].map(([key,value])=>({key,value:clone(value),version:this.versions.get(this.versionKey(name,key))})); return { items:rows.slice(0,options.limit??rows.length), cursor:null }; }
  async query(name,indexName,options={}){ const allowed=new Set(['eq','prefix','between','order','limit','cursor']); for(const option of Object.keys(options))if(!allowed.has(option))throw new Error(`unsupported query option ${option}`); const index=indexes[indexName]; if(!index)throw new Error(`unknown index ${indexName}`); let rows=[...this.collection(name)].map(([key,value])=>({key,value:clone(value),version:this.versions.get(this.versionKey(name,key))})); if(options.eq!==undefined)rows=rows.filter(row=>row.value[index.field]===options.eq); if(options.prefix!==undefined)rows=rows.filter(row=>String(row.value[index.field]??'').startsWith(String(options.prefix))); if(options.between){const [lower,upper]=options.between;rows=rows.filter(row=>String(row.value[index.sortField]??'')>=String(lower)&&String(row.value[index.sortField]??'')<=String(upper));} if(index.sortField)rows.sort((a,b)=>String(a.value[index.sortField]??'').localeCompare(String(b.value[index.sortField]??''))*(options.order==='desc'?-1:1)); return { items:rows.slice(0,options.limit??rows.length), cursor:null }; }
  async increment(name,key,field,amount=1){ const value=await this.get(name,key)??{}; value[field]=(value[field]??0)+amount; return this.put(name,key,value); }
  async batchGet(name,keys){ return Promise.all(keys.map(key=>this.get(name,key))); }
  async batchPut(name,items){ return Promise.all(items.map(item=>this.put(name,item.key,item.value,item.options))); }
  async batchDelete(name,keys){ return Promise.all(keys.map(key=>this.delete(name,key))); }
}

export function makeContext(data,{request={},secrets={},httpFetch=async()=>({ok:true,status:200,json:async()=>({id:'channel'})})}={}){
  return { data, modules:{dropradar:api,tweetnacl}, request:{method:'GET',headers:{},query:{},params:{},body:'',...request}, secrets:{get:async name=>secrets[name]}, http:{fetch:httpFetch} };
}

export function loadHandler(relativePath){ const source=fs.readFileSync(new URL(`../hedy/functions/${relativePath}`,import.meta.url),'utf8'); const sandbox={console,Date,JSON,Math,Uint8Array,parseInt,encodeURIComponent,Promise}; vm.createContext(sandbox); vm.runInContext(`${source}\n;globalThis.__handler=handler;`,sandbox,{filename:relativePath}); return sandbox.__handler; }
