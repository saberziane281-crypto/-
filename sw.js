const V='sahati-v2',FILES=['./','./index.html','./manifest.json','./icons/icon-192.png','./icons/icon-512.png','./icons/logo.png'];
let timers=[];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!=='sahati-sched').map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res})
    .catch(()=>caches.match(r).then(x=>x||caches.match('./index.html'))));
});
const show=i=>self.registration.showNotification(i.title,{body:i.body,tag:i.id,icon:'./icons/icon-192.png',badge:'./icons/icon-192.png',requireInteraction:true,vibrate:[300,150,300]});
async function saveSched(items){const c=await caches.open('sahati-sched');await c.put('sched',new Response(JSON.stringify(items)))}
async function loadSched(){const c=await caches.open('sahati-sched'),r=await c.match('sched');return r?r.json():[]}
self.addEventListener('message',e=>{
  if(!e.data||e.data.type!=='sched')return;
  const items=e.data.items,now=Date.now();
  timers.forEach(clearTimeout);timers=[];
  items.forEach(i=>{const d=i.at-now;if(d>0&&d<6*3600e3)timers.push(setTimeout(()=>show(i),d))});
  e.waitUntil(saveSched(items));
});
self.addEventListener('periodicsync',e=>{
  if(e.tag!=='sahati-check')return;
  e.waitUntil(loadSched().then(items=>{const n=Date.now();return Promise.all(items.filter(i=>i.at<=n&&n-i.at<20*60e3).map(show))}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>l.length?l[0].focus():clients.openWindow('./')));
});
