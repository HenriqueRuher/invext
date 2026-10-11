// Invext service worker: funciona offline e busca a versão nova quando há internet.
const CACHE='invext-03f680a3';
const SHELL=['./','index.html','manifest.webmanifest','icon.svg','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('invext-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){ // rede primeiro (sem cache HTTP velho), cache se estiver offline
    if(u.pathname.endsWith('/version.json'))return; // checagem de atualização: sempre direto na rede
    const net=r.mode==='navigate'||/\/(index\.html)?$/.test(u.pathname)?fetch(r.url,{cache:'no-cache'}):fetch(r);
    e.respondWith(net.then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
  }else if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){ // fontes: cache primeiro
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res})));
  }
});
