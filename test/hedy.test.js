import test from 'node:test';
import assert from 'node:assert/strict';
import { api, loadHandler, makeContext, MemoryHedyData, tweetnacl } from '../test-support/hedy-fixture.js';

const fixture={productId:'sv151-etb',sourceItemId:'sku-1',observedAt:'2026-01-01T00:00:00Z',evidence:{kind:'authorized-export'},price:49.99,state:'available'};
const seed=async(data,source,items)=>{for(let i=0;i<items.length;i++)await data.put(api.C.imports,`${source}:${i}`,{...items[i],source});};

test('sandbox handlers use handler(ctx), ctx.modules, and same-origin route data',async()=>{const data=new MemoryHedyData();await seed(data,api.SOURCES[0],[fixture]);await api.collect(makeContext(data),{now:()=>new Date('2026-01-02T00:00:00Z'),retryOptions:{delayMs:0}});const products=loadHandler('products.js');const list=await products(makeContext(data,{request:{query:{q:'151'}}}));const body=JSON.parse(list.body);assert.equal(list.status,200);assert.ok(body.length>=2);const detail=await loadHandler('product-detail.js')(makeContext(data,{request:{params:{id:'sv151-etb'}}}));assert.equal(JSON.parse(detail.body).current[0].source,api.SOURCES[0]);});

test('CAS collectors deduplicate parallel observations, alerts, and deliveries',async()=>{const data=new MemoryHedyData();await seed(data,api.SOURCES[0],[fixture]);await api.watch(data,'watcher','sv151-etb',new Date('2025-12-31T00:00:00Z'));const ctx=makeContext(data);const options={now:()=>new Date('2026-01-02T00:00:00Z'),retryOptions:{delayMs:0}};const [a,b]=await Promise.all([api.collect(ctx,options),api.collect(ctx,options)]);assert.equal(a.observations+b.observations,1);assert.equal((await data.list(api.C.observations)).items.length,1);assert.equal((await data.list(api.C.alerts)).items.length,1);assert.equal((await data.list(api.C.deliveries)).items.length,1);});

test('stale observations remain history without current regression or false alert',async()=>{const data=new MemoryHedyData(),ctx=makeContext(data),health={source:'s',completedAt:'2026-01-03T00:00:00Z'};const observation=(at,state)=>({productId:'p',source:'s',sourceItemId:at,observedAt:at,evidence:{kind:'fixture'},price:10,currency:'USD',state,url:null,adapterVersion:'test'});await api.commitObservation(ctx,observation('2026-01-02T00:00:00.000Z','OUT_OF_STOCK'),health);const stale=await api.commitObservation(ctx,observation('2026-01-01T00:00:00.000Z','IN_STOCK'),health);assert.equal(stale.alerted,false);assert.equal((await data.get(api.C.current,'p:s')).state,'OUT_OF_STOCK');assert.equal((await data.list(api.C.observations)).items.length,2);});

test('a lost CAS attempt cannot leak winner state or create a stale alert',async()=>{const data=new MemoryHedyData(),ctx=makeContext(data),health={source:'s',completedAt:'2026-01-03T00:00:00Z'},originalPut=data.put.bind(data);let injected=false;data.put=async(collection,key,value,options)=>{if(!injected&&collection===api.C.current){injected=true;await originalPut(collection,key,{...value,observedAt:'2026-01-02T00:00:00.000Z',state:'OUT_OF_STOCK',_observationId:'newer'});throw Object.assign(new Error('version conflict'),{code:'PRECONDITION_FAILED'});}return originalPut(collection,key,value,options);};const stale={productId:'p',source:'s',sourceItemId:'stale',observedAt:'2026-01-01T00:00:00.000Z',evidence:{kind:'fixture'},price:10,currency:'USD',state:'IN_STOCK',url:null,adapterVersion:'test'};const result=await api.commitObservation(ctx,stale,health);assert.equal(result.alerted,false);assert.equal((await data.get(api.C.current,'p:s')).state,'OUT_OF_STOCK');assert.equal((await data.list(api.C.alerts)).items.length,0);});

test('replay reconciles deliveries after interruption following alert creation',async()=>{const data=new MemoryHedyData(),ctx=makeContext(data),health={source:'s',completedAt:'2026-01-03T00:00:00Z'};await api.watch(data,'u','p');const observation={productId:'p',source:'s',sourceItemId:'item',observedAt:'2026-01-01T00:00:00.000Z',evidence:{kind:'fixture'},price:10,currency:'USD',state:'IN_STOCK',url:null,adapterVersion:'test'},originalPut=data.put.bind(data);let interrupted=false;data.put=async(collection,...args)=>{if(!interrupted&&collection===api.C.deliveries){interrupted=true;throw new Error('interrupted');}return originalPut(collection,...args);};await assert.rejects(api.commitObservation(ctx,observation,health),/interrupted/);data.put=originalPut;await api.commitObservation(ctx,observation,health);assert.equal((await data.list(api.C.alerts)).items.length,1);assert.equal((await data.list(api.C.deliveries)).items.length,1);});

test('collector quarantines conflicts/malformed rows and marks empty lanes UNCONFIGURED',async()=>{const data=new MemoryHedyData();await seed(data,api.SOURCES[0],[fixture,{...fixture,sourceItemId:'conflict',state:'out_of_stock'},{...fixture,productId:'missing',sourceItemId:'bad',observedAt:'2026-01-02T00:00:00Z'},{...fixture,sourceItemId:'later',observedAt:'2026-01-03T00:00:00Z',state:'out_of_stock'}]);const result=await api.collect(makeContext(data),{now:()=>new Date('2026-01-04T00:00:00Z'),retryOptions:{delayMs:0}});assert.equal(result.observations,1);assert.equal(result.sources[api.SOURCES[0]],'DEGRADED');assert.equal(result.sources[api.SOURCES[1]],'UNCONFIGURED');});

test('delivery sandbox uses ctx.secrets.get and ctx.http.fetch with retry state',async()=>{const data=new MemoryHedyData(),alert={id:'a',productId:'p',observation:{source:'s',state:'IN_STOCK',price:10,currency:'USD',observedAt:'2026-01-01T00:00:00Z'}},delivery={id:'a:u',alertId:'a',userId:'u',productId:'p',alert,status:'PENDING',attempts:0,updatedAt:'2026-01-01T00:00:00Z'};await data.put(api.C.deliveries,delivery.id,delivery);let calls=0;const ctx=makeContext(data,{secrets:{DISCORD_BOT_TOKEN:'secret'},httpFetch:async()=>{calls++;return{ok:true,status:200,json:async()=>({id:'channel'})};}});const response=await loadHandler('deliver.js')(ctx);assert.equal(JSON.parse(response.body).sent,1);assert.equal(calls,2);assert.equal((await data.get(api.C.deliveries,delivery.id)).status,'SENT');});

test('status-indexed queue drains beyond one page and CAS claim tokens fence stale workers',async()=>{const data=new MemoryHedyData();for(let i=0;i<201;i++){const status=i<100?'SENT':'PENDING',id=`a${i}:u`;await data.put(api.C.deliveries,id,{id,userId:'u',alert:{id:`a${i}`},status,attempts:0,updatedAt:'2026-01-01T00:00:00Z'});}let candidates=[];for(let run=0;run<3;run++){for(const candidate of await api.deliveryCandidates(data,new Date('2026-01-02T00:00:00Z'))){const claim=await api.claimDelivery(data,candidate,new Date('2026-01-02T00:00:00Z'));if(claim){candidates.push(claim.id);await api.settleDelivery(data,claim.id,claim.claimToken,'SENT',new Date('2026-01-02T00:00:01Z'));}}}assert.equal(new Set(candidates).size,101);const candidate={id:'lease:u',userId:'u',alert:{id:'lease'},status:'PENDING',attempts:0,updatedAt:'2026-01-01T00:00:00Z'};await data.put(api.C.deliveries,candidate.id,candidate);const first=await api.claimDelivery(data,candidate,new Date('2026-01-01T00:00:00Z'));const second=await api.claimDelivery(data,candidate,new Date('2026-01-01T00:02:00Z'));await api.settleDelivery(data,first.id,first.claimToken,'PENDING',new Date('2026-01-01T00:02:01Z'),new Error('late'));assert.equal((await data.get(api.C.deliveries,candidate.id)).claimToken,second.claimToken);});

test('Discord sandbox verifies Ed25519 without undocumented runtime helpers',async()=>{const handler=loadHandler('discord.js'),data=new MemoryHedyData(),body=JSON.stringify({type:1}),timestamp=String(Math.floor(Date.now()/1000));const keys=tweetnacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(7));const message=new TextEncoder().encode(timestamp+body),signature=tweetnacl.sign.detached(message,keys.secretKey);const hex=bytes=>[...bytes].map(value=>value.toString(16).padStart(2,'0')).join('');const request={method:'POST',body,headers:{'x-signature-ed25519':hex(signature),'x-signature-timestamp':timestamp}};const accepted=await handler(makeContext(data,{request,secrets:{DISCORD_PUBLIC_KEY:hex(keys.publicKey)}}));assert.equal(JSON.parse(accepted.body).type,1);request.headers['x-signature-ed25519']='00'.repeat(64);assert.equal((await handler(makeContext(data,{request,secrets:{DISCORD_PUBLIC_KEY:hex(keys.publicKey)}}))).status,401);});


test('Pokémon sealed collector is watch-scoped and preserves provider provenance/currency', async () => {
  const data = new MemoryHedyData();
  const handler = loadHandler('collect-pokemontcg.js');
  let calls = 0;
  const idle = await handler(makeContext(data, {
    secrets: { POKEMONTCG_API_KEY: 'test-key' },
    httpFetch: async () => { calls++; throw new Error('should not call provider without watches'); }
  }));
  assert.equal(JSON.parse(idle.body).observations, 0);
  assert.equal(calls, 0);

  await api.watch(data, 'watcher', 'sv151-etb', new Date('2026-09-30T00:00:00Z'));
  const responses = [
    {
      ok: true, status: 200,
      json: async () => ({ data: [
        { id: '151-elite-trainer-box', name: '151 Elite Trainer Box', kind: 'ETB', set_name: '151' },
        { id: '151-pokemon-center-elite-trainer-box', name: '151 Pokemon Center Elite Trainer Box', kind: 'ETB', set_name: '151' }
      ] })
    },
    {
      ok: true, status: 200,
      json: async () => ({ data: { quotes: [
        { source: 'CARDMARKET', variant: 'MARKET', basis: 'ASKING', amount: 425.24, currency: 'EUR', locale: 'en', as_of: '2026-05-28', sample_n: 269, provenance: 'Cardmarket' }
      ] }, meta: { delayed_hours: 0 } })
    }
  ];
  const ctx = makeContext(data, {
    secrets: { POKEMONTCG_API_KEY: 'test-key' },
    httpFetch: async () => { calls++; return responses.shift(); }
  });
  const result = JSON.parse((await handler(ctx)).body);
  assert.equal(result.status, 'HEALTHY');
  assert.equal(result.observations, 1);
  const current = await data.get(api.C.current, 'sv151-etb:pokemontcgapi-cardmarket');
  assert.equal(current.currency, 'EUR');
  assert.equal(current.evidence.provenance, 'Cardmarket');
  assert.equal(current.evidence.basis, 'ASKING');
  assert.equal(current.state, 'UNKNOWN');
  assert.equal(calls, 2);
});


test('growth tracker allowlists event names and bounds properties', async () => {
  const data = new MemoryHedyData();
  const events = [];
  const handler = loadHandler('track-growth.js');
  const response = await handler(makeContext(data, {
    request: { method: 'POST', body: JSON.stringify({ event: 'search', query: 'x'.repeat(200), path: '/products' }) },
    trackEvent: async (name, properties) => events.push({ name, properties })
  }));
  assert.equal(response.status, 204);
  assert.equal(events.length, 1);
  assert.equal(events[0].name, 'growth_search');
  assert.equal(events[0].properties.query.length, 80);
  const bad = await handler(makeContext(data, {
    request: { method: 'POST', body: JSON.stringify({ event: 'purchase' }) },
    trackEvent: async () => { throw new Error('must not track unsupported event'); }
  }));
  assert.equal(bad.status, 400);
});

test('retailer redirect fails closed and tracks only allowlisted retailer hosts', async () => {
  const data = new MemoryHedyData();
  const handler = loadHandler('retailer-redirect.js');
  const events = [];
  const request = { method: 'GET', params: { retailer: 'walmart', product: 'sv151-etb' } };

  const missing = await handler(makeContext(data, { request, trackEvent: async () => {} }));
  assert.equal(missing.status, 404);

  await data.put('retailer_links', 'walmart:sv151-etb', { status: 'ACTIVE', url: 'https://evil.example/item', affiliateEnabled: true });
  const rejected = await handler(makeContext(data, { request, trackEvent: async () => {} }));
  assert.equal(rejected.status, 400);

  await data.put('retailer_links', 'walmart:sv151-etb', { status: 'ACTIVE', url: 'https://www.walmart.com/ip/123', affiliateEnabled: false, program: 'organic' });
  const accepted = await handler(makeContext(data, { request, trackEvent: async (name, properties) => events.push({ name, properties }) }));
  assert.equal(accepted.status, 302);
  assert.equal(accepted.headers.location, 'https://www.walmart.com/ip/123');
  assert.equal(events.length, 1);
  assert.equal(events[0].name, 'growth_retailer_click');
  assert.equal(events[0].properties.productId, 'sv151-etb');
  assert.equal(events[0].properties.retailer, 'walmart');
});
