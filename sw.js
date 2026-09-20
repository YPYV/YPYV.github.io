const CACHE = "dalil-v3";
const CORE = [
  "./","index.html","styles.css","app.js","manifest.json",
  "data/directory.json",
  "assets/favicon.svg","assets/logo.svg","assets/pattern.svg",
  "assets/medical.svg","assets/government.svg","assets/labs.svg",
  "assets/imaging.svg","assets/directorates.svg","assets/citizens.svg",
  "assets/cover-medical.svg","assets/cover-government.svg",
  "assets/icon-192.png","assets/icon-512.png"
];

// files that change often -> always try the network first, cache is only a fallback for offline use
const NETWORK_FIRST = [
  "./","index.html","styles.css","app.js","manifest.json","data/directory.json"
];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener("fetch", e=>{
  if(e.request.method!=="GET")return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return; // let cross-origin (fonts, hero photo) pass through normally

  const isNetworkFirst = NETWORK_FIRST.some(p=>url.pathname===location.pathname.replace(/[^/]*$/,"")+p.replace("./","") || url.pathname.endsWith(p.replace("./","")));

  if(isNetworkFirst){
    e.respondWith(
      fetch(e.request,{cache:"no-store"}).then(res=>{if(res.ok)caches.open(CACHE).then(c=>c.put(e.request,res.clone()));return res;})
      .catch(()=>caches.match(e.request))
    );
    return;
  }

  // rarely-changing assets (icons/images): cache first, then network
  e.respondWith(
    caches.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{
      if(res.ok)caches.open(CACHE).then(c=>c.put(e.request,res.clone()));return res;
    }))
  );
});
