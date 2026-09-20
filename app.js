
const STATIC="data/directory.json";
const $=id=>document.getElementById(id);
const state={items:[],userLoc:null};

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const mapUrl=x=>x.plusCode&&x.plusCode!=="غير متوفر"?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.plusCode)}`:"";
const telUrl=x=>{const p=String(x.phone||"").replace(/[^\d+]/g,"");return p&&p!=="+"?`tel:${p}`:""};
function distanceKm(lat1,lng1,lat2,lng2){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

async function loadData(){
  const r=await fetch(STATIC);if(!r.ok)throw new Error("تعذر تحميل البيانات");
  state.items=await r.json();
  populateCategoryFilter();updateStats();render();
}
function populateCategoryFilter(){
  const cats=[...new Set(state.items.map(x=>x.category).filter(Boolean))].sort((a,b)=>a.localeCompare("ar"));
  $("category").innerHTML=`<option value="">التصنيف: الكل</option>`+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
}
function updateStats(){
  const d=state.items;
  const cards=[
    ["📍","إجمالي الجهات",d.length,"","",""],
    ["🏥","الجهات الطبية",d.filter(x=>x.type==="medical").length,"type","medical",""],
    ["🏛️","الجهات الحكومية",d.filter(x=>x.type==="government").length,"type","government",""],
    ["✓","الجهات الموثقة",d.filter(x=>String(x.verification).includes("🟢")).length,"verification","🟢 موثقة",""]
  ];
  $("stats").innerHTML=cards.map(c=>`<button type="button" class="stat" data-filter-field="${c[3]}" data-filter-value="${esc(c[4])}" aria-label="فلترة حسب ${esc(c[1])}"><div class="stat-head"><span class="stat-icon">${c[0]}</span>${c[1]}</div><div class="stat-val">${c[2]}</div></button>`).join("");
}
function filtered(){
  const q=$("search").value.trim().toLowerCase(),type=$("type").value,cat=$("category").value,gov=$("gov").value,ver=$("verification").value;
  return state.items.filter(x=>{
    const typeLabel=x.type==="medical"?"طبي":"حكومي";
    const hay=[x.name,x.category,x.governorate,x.address,x.phone,typeLabel].join(" ").toLowerCase();
    return(!q||hay.includes(q))&&(!type||x.type===type)&&(!cat||x.category===cat)&&(!gov||x.governorate===gov)&&(!ver||x.verification===ver)
  })
}
function render(){
  let arr=filtered();
  if(state.userLoc){
    const withLoc=[],withoutLoc=[];
    arr.forEach(x=>{
      if(typeof x.lat==="number"&&typeof x.lng==="number"){x._dist=distanceKm(state.userLoc.lat,state.userLoc.lng,x.lat,x.lng);withLoc.push(x)}
      else withoutLoc.push(x)
    });
    withLoc.sort((a,b)=>a._dist-b._dist);
    arr=[...withLoc,...withoutLoc];
  }
  $("count").textContent=`عرض ${arr.length} من أصل ${state.items.length} منشأة`;
  if(!arr.length){$("results").innerHTML=`<div class="empty">لم نجد منشآت مطابقة لبحثك.</div>`;return}
  $("results").innerHTML=arr.map(x=>{const ok=String(x.verification).includes("🟢"),map=mapUrl(x);
    const dist=typeof x._dist==="number"?`<span class="distance-badge">📍 ${x._dist<1?Math.round(x._dist*1000)+" م":x._dist.toFixed(1)+" كم"}</span>`:"";
    return `<article class="card" data-type="${esc(x.type)}"><div class="card-cover"><img src="assets/cover-${esc(x.type)}.svg" alt=""></div><div class="card-top"><span class="chip">${x.type==="medical"?"🏥 طبي":"🏛️ حكومي"}</span><span class="badge ${ok?"ok":"warn"}" title="${ok?"تم التحقق من المعلومات":"المعلومات بحاجة إلى مراجعة"}">${esc(x.verification)}</span></div>
    <h3>${esc(x.name)}${dist}</h3><div class="meta">
    <div class="meta-line"><span class="meta-ico">◉</span>${esc(x.category)}</div>
    <div class="meta-line"><span class="meta-ico">⌖</span>${esc(x.governorate)}</div>
    </div><div class="card-foot"><span class="source">${esc(x.source)}</span><div class="card-foot-actions"><button class="map-btn share-btn" data-id="${esc(x.id)}" aria-label="مشاركة عبر واتساب" title="مشاركة عبر واتساب">↗</button><button class="map-btn detail-btn" data-id="${esc(x.id)}">عرض التفاصيل</button>${map?`<button class="map-btn map-open-btn" data-map="${esc(map)}" aria-label="فتح الموقع على الخريطة">الخريطة</button>`:""}</div></div></article>`
  }).join("");
}
$("results").addEventListener("click",e=>{const b=e.target.closest(".map-open-btn");if(b)window.open(b.dataset.map,"_blank","noopener")});
$("nearMe").addEventListener("click",()=>{
  const btn=$("nearMe"),note=$("nearNote");
  if(state.userLoc){state.userLoc=null;btn.setAttribute("aria-pressed","false");btn.textContent="📍 الأقرب مني";note.hidden=true;render();return}
  if(!("geolocation" in navigator)){note.hidden=false;note.textContent="متصفحك لا يدعم تحديد الموقع الجغرافي.";return}
  btn.textContent="⏳ جاري تحديد موقعك...";
  navigator.geolocation.getCurrentPosition(pos=>{
    state.userLoc={lat:pos.coords.latitude,lng:pos.coords.longitude};
    btn.setAttribute("aria-pressed","true");btn.textContent="📍 الأقرب مني ✓";
    const withCoords=state.items.filter(x=>typeof x.lat==="number").length;
    note.hidden=false;note.textContent=`تم ترتيب النتائج حسب الأقرب لموقعك. ${withCoords} من أصل ${state.items.length} جهة عندها موقع جغرافي دقيق حالياً؛ الباقي بيظهر بترتيبه الطبيعي بعدها.`;
    render();
  },err=>{
    btn.textContent="📍 الأقرب مني";
    note.hidden=false;
    note.textContent=err.code===1?"تم رفض إذن الوصول للموقع. فعّله من إعدادات المتصفح إذا حبيت تجرب هالميزة.":"تعذر تحديد موقعك حالياً، جرّب مرة تانية.";
  },{enableHighAccuracy:true,timeout:10000});
});
function categoryFilter(action,button){
  document.querySelectorAll(".category").forEach(b=>b.classList.remove("active"));button.classList.add("active");
  const note=$("quick");$("category").value="";
  if(action==="medical"){$("type").value="medical";$("search").value="";note.textContent="عرض جميع الجهات الطبية والمراكز الصحية."}
  if(action==="government"){$("type").value="government";$("search").value="";note.textContent="عرض جميع الجهات والوزارات الحكومية."}
  if(action==="labs"){$("type").value="medical";$("search").value="مخبر";note.textContent="فلترة المرافق الطبية للمخابر والتحاليل."}
  if(action==="imaging"){$("type").value="medical";$("search").value="تصوير";note.textContent="فلترة المرافق الطبية للتصوير الطبي."}
  if(action==="directorates"){$("type").value="government";$("search").value="مديرية";note.textContent="فلترة الجهات الحكومية للمديريات والجهات."}
  if(action==="citizens"){$("type").value="government";$("search").value="خدمة";note.textContent="فلترة الجهات الحكومية التي يظهر اسمها بخدمات المواطنين."}
  render();$("directory").scrollIntoView({behavior:"smooth",block:"start"});
}
document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>categoryFilter(b.dataset.action,b)));
$("stats").addEventListener("click",e=>{
  const b=e.target.closest(".stat");if(!b)return;
  const field=b.dataset.filterField;
  if(!field){$("type").value="";$("verification").value=""}
  else{$(field).value=b.dataset.filterValue}
  render();$("directory").scrollIntoView({behavior:"smooth",block:"start"});
});
$("results").addEventListener("click",e=>{const b=e.target.closest(".detail-btn");if(b)showDetail(b.dataset.id)});
$("results").addEventListener("click",e=>{
  const b=e.target.closest(".share-btn");if(!b)return;
  const x=state.items.find(a=>a.id===Number(b.dataset.id));if(!x)return;
  const lines=[x.name,x.category,x.address&&x.address!=="غير متوفر"?"العنوان: "+x.address:"",x.phone&&x.phone!=="غير متوفر"?"الهاتف: "+x.phone:"","— عبر دليل دمشق وريف دمشق"].filter(Boolean).join("\n");
  window.open("https://wa.me/?text="+encodeURIComponent(lines),"_blank","noopener");
});
$("results").addEventListener("click",e=>{
  if(e.target.closest("button"))return;
  const card=e.target.closest(".card");if(!card)return;
  const already=card.classList.contains("show-cover");
  document.querySelectorAll(".card.show-cover").forEach(c=>c.classList.remove("show-cover"));
  if(!already)card.classList.add("show-cover");
});
["search","type","category","gov","verification"].forEach(id=>$(id).addEventListener("input",render));
["type","category","gov","verification"].forEach(id=>$(id).addEventListener("change",render));
$("heroBtn").addEventListener("click",()=>{$("search").value=$("heroSearch").value;render();$("directory").scrollIntoView({behavior:"smooth"})});
$("heroSearch").addEventListener("keydown",e=>{if(e.key==="Enter")$("heroBtn").click()});
$("heroSearch").addEventListener("input",()=>{$("search").value=$("heroSearch").value;render()});
$("clear").addEventListener("click",()=>{["search","heroSearch"].forEach(id=>$(id).value="");["type","category","gov","verification"].forEach(id=>$(id).value="");document.querySelectorAll(".category").forEach(b=>b.classList.remove("active"));$("quick").textContent="اختر أحد الأقسام للوصول إليه مباشرة.";state.userLoc=null;$("nearMe").setAttribute("aria-pressed","false");$("nearMe").textContent="📍 الأقرب مني";$("nearNote").hidden=true;render()});
$("closeModal").addEventListener("click",()=>$("modal").classList.remove("open"));
$("modal").addEventListener("click",e=>{if(e.target.id==="modal")$("modal").classList.remove("open")});
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("modal").classList.remove("open")});
function showDetail(id){
  const x=state.items.find(a=>a.id===Number(id));if(!x)return;
  $("modalTitle").textContent=x.name;
  $("modalBody").innerHTML=`<div class="detail-grid">
  <div class="detail"><div class="detail-label">النوع</div><div class="detail-value">${x.type==="medical"?"طبي":"حكومي"}</div></div>
  <div class="detail"><div class="detail-label">التصنيف</div><div class="detail-value">${esc(x.category)}</div></div>
  <div class="detail"><div class="detail-label">المحافظة</div><div class="detail-value">${esc(x.governorate)}</div></div>
  <div class="detail"><div class="detail-label">الهاتف</div><div class="detail-value">${esc(x.phone)}</div></div>
  <div class="detail"><div class="detail-label">العنوان</div><div class="detail-value">${esc(x.address)}</div></div>
  <div class="detail"><div class="detail-label">الدوام</div><div class="detail-value">${esc(x.hours)}</div></div>
  <div class="detail"><div class="detail-label">حالة التوثيق</div><div class="detail-value">${esc(x.verification)}</div></div>
  <div class="detail"><div class="detail-label">المصدر</div><div class="detail-value">${esc(x.source)}</div></div></div>
  <div class="actions">${telUrl(x)?`<a class="action call" href="${telUrl(x)}">☎ اتصال</a>`:""}${mapUrl(x)?`<a class="action map" href="${mapUrl(x)}" target="_blank" rel="noopener">📍 فتح الموقع على الخريطة</a>`:""}<button class="action map copy-btn" type="button">⧉ نسخ المعلومات</button></div>`;
  const cb=$("modalBody").querySelector(".copy-btn");
  if(cb)cb.addEventListener("click",()=>{
    const text=[x.name,x.category,x.address&&x.address!=="غير متوفر"?"العنوان: "+x.address:"",x.phone&&x.phone!=="غير متوفر"?"الهاتف: "+x.phone:"",x.hours&&x.hours!=="غير متوفر"?"الدوام: "+x.hours:""].filter(Boolean).join("\n");
    navigator.clipboard&&navigator.clipboard.writeText(text).then(()=>{cb.textContent="✓ تم النسخ";setTimeout(()=>cb.textContent="⧉ نسخ المعلومات",1600)});
  });
  $("modal").classList.add("open");
}
loadData().catch(()=>{$("error").style.display="block";$("error").textContent="تعذر تحميل الدليل. تحقق من ملفات البيانات."});
if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})});}
