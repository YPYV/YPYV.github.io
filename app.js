
const API="http://localhost:3001/api";
const STATIC="data/directory.json";
const $=id=>document.getElementById(id);
const state={items:[]};

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const mapUrl=x=>x.plusCode&&x.plusCode!=="غير متوفر"?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.plusCode)}`:"";
const telUrl=x=>{const p=String(x.phone||"").replace(/[^\d+]/g,"");return p&&p!=="+"?`tel:${p}`:""};

async function loadData(){
  const isLocal=["localhost","127.0.0.1"].includes(location.hostname);
  try{
    if(!isLocal)throw 0;
    const r=await fetch(`${API}/directory`);if(!r.ok)throw 0;state.items=(await r.json()).data||[]
  }
  catch{const r=await fetch(STATIC);if(!r.ok)throw new Error("تعذر تحميل البيانات");state.items=await r.json()}
  updateStats();render();
}
function updateStats(){
  const d=state.items;
  const cards=[["📍","إجمالي الجهات",d.length,"#EAF2F7"],["🏥","الجهات الطبية",d.filter(x=>x.type==="medical").length,"#EAF8F5"],["🏛️","الجهات الحكومية",d.filter(x=>x.type==="government").length,"#EEF7FE"],["✓","الجهات الموثقة",d.filter(x=>String(x.verification).includes("🟢")).length,"#FFF5E8"]];
  $("stats").innerHTML=cards.map(c=>`<div class="stat"><div class="stat-head"><span class="stat-icon" style="background:${c[3]}">${c[0]}</span>${c[1]}</div><div class="stat-val">${c[2]}</div></div>`).join("");
}
function filtered(){
  const q=$("search").value.trim().toLowerCase(),type=$("type").value,gov=$("gov").value,ver=$("verification").value;
  return state.items.filter(x=>{const hay=[x.name,x.category,x.governorate,x.address,x.phone].join(" ").toLowerCase();return(!q||hay.includes(q))&&(!type||x.type===type)&&(!gov||x.governorate===gov)&&(!ver||x.verification===ver)})
}
function render(){
  const arr=filtered();$("count").textContent=`${arr.length} نتيجة`;
  if(!arr.length){$("results").innerHTML=`<div class="empty">لا توجد نتائج مطابقة. جرّب تغيير البحث أو الفلاتر.</div>`;return}
  $("results").innerHTML=arr.map(x=>{const ok=String(x.verification).includes("🟢"),map=mapUrl(x);
    return `<article class="card" data-type="${x.type}"><div class="card-cover"><img src="assets/cover-${x.type}.svg" alt=""></div><div class="card-top"><span class="chip">${x.type==="medical"?"🏥 طبي":"🏛️ حكومي"}</span><span class="badge ${ok?"ok":"warn"}">${esc(x.verification)}</span></div>
    <h3>${esc(x.name)}</h3><div class="meta">
    <div class="meta-line"><span class="meta-ico">◉</span>${esc(x.category)}</div>
    <div class="meta-line"><span class="meta-ico">⌖</span>${esc(x.governorate)}</div>
    <div class="meta-line"><span class="meta-ico">▣</span>${esc(x.address)}</div>
    <div class="meta-line"><span class="meta-ico">☎</span>${esc(x.phone)}</div>
    ${x.hours&&x.hours!=="غير متوفر"?`<div class="meta-line"><span class="meta-ico">◷</span>${esc(x.hours)}</div>`:""}
    </div><div class="card-foot"><span class="source">${esc(x.source)}</span><div style="display:flex;gap:6px"><button class="map-btn share-btn" data-id="${x.id}" title="مشاركة عبر واتساب">↗</button><button class="map-btn detail-btn" data-id="${x.id}">التفاصيل</button>${map?`<button class="map-btn" onclick="window.open('${map}','_blank','noopener')">الخريطة</button>`:""}</div></div></article>`
  }).join("");
}
function categoryFilter(action,button){
  document.querySelectorAll(".category").forEach(b=>b.classList.remove("active"));button.classList.add("active");
  const note=$("quick");
  if(action==="medical"){$("type").value="medical";$("search").value="";note.textContent="عرض جميع الجهات الطبية والمراكز الصحية."}
  if(action==="government"){$("type").value="government";$("search").value="";note.textContent="عرض جميع الجهات والوزارات الحكومية."}
  if(action==="labs"){$("type").value="medical";$("search").value="مخبر";note.textContent="فلترة المرافق الطبية للمخابر والتحاليل."}
  if(action==="imaging"){$("type").value="medical";$("search").value="تصوير";note.textContent="فلترة المرافق الطبية للتصوير الطبي."}
  if(action==="directorates"){$("type").value="government";$("search").value="مديرية";note.textContent="فلترة الجهات الحكومية للمديريات والجهات."}
  if(action==="citizens"){$("type").value="government";$("search").value="خدمة";note.textContent="فلترة الجهات الحكومية التي يظهر اسمها بخدمات المواطنين."}
  render();$("directory").scrollIntoView({behavior:"smooth",block:"start"});
}
document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>categoryFilter(b.dataset.action,b)));
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
["search","type","gov","verification"].forEach(id=>$(id).addEventListener("input",render));
["type","gov","verification"].forEach(id=>$(id).addEventListener("change",render));
$("heroBtn").addEventListener("click",()=>{$("search").value=$("heroSearch").value;render();$("directory").scrollIntoView({behavior:"smooth"})});
$("heroSearch").addEventListener("keydown",e=>{if(e.key==="Enter")$("heroBtn").click()});
$("heroSearch").addEventListener("input",()=>{$("search").value=$("heroSearch").value;render()});
$("clear").addEventListener("click",()=>{["search","heroSearch"].forEach(id=>$(id).value="");["type","gov","verification"].forEach(id=>$(id).value="");document.querySelectorAll(".category").forEach(b=>b.classList.remove("active"));$("quick").textContent="اختر أحد الأقسام للوصول إليه مباشرة.";render()});
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
  <div class="detail"><div class="detail-label">الدوام</div><div class="detail-value">${esc(x.hours)}</div></div></div>
  <div class="actions">${telUrl(x)?`<a class="action call" href="${telUrl(x)}">☎ اتصال</a>`:""}${mapUrl(x)?`<a class="action map" href="${mapUrl(x)}" target="_blank" rel="noopener">⌖ فتح الخريطة</a>`:""}<button class="action map copy-btn" type="button">⧉ نسخ المعلومات</button></div>`;
  const cb=$("modalBody").querySelector(".copy-btn");
  if(cb)cb.addEventListener("click",()=>{
    const text=[x.name,x.category,x.address&&x.address!=="غير متوفر"?"العنوان: "+x.address:"",x.phone&&x.phone!=="غير متوفر"?"الهاتف: "+x.phone:"",x.hours&&x.hours!=="غير متوفر"?"الدوام: "+x.hours:""].filter(Boolean).join("\n");
    navigator.clipboard&&navigator.clipboard.writeText(text).then(()=>{cb.textContent="✓ تم النسخ";setTimeout(()=>cb.textContent="⧉ نسخ المعلومات",1600)});
  });
  $("modal").classList.add("open");
}
loadData().catch(()=>{$("error").style.display="block";$("error").textContent="تعذر تحميل الدليل. تحقق من ملفات البيانات."});
if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})});}
