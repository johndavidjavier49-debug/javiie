/* Portfolio: saves online with Supabase so every device and every visitor sees the same content */
const $=s=>document.querySelector(s);
const CATS=[["quiz","Quiz","Short quizzes I have taken."],["longquiz","Long Quiz","Longer quizzes covering full lessons."],["midterms","Midterms","Midterm exams and results."],["finals","Finals","Final exams and results."],["activity","Activity","Classroom and take-home activities."],["project","Project","Projects I built and presented."]];
const C=window.CONFIG||{};
const sb=C.SUPABASE_URL&&window.supabase?supabase.createClient(C.SUPABASE_URL,C.SUPABASE_KEY):null;
const B=()=>sb.storage.from("uploads");
const url=(p,dl)=>B().getPublicUrl(p,dl?{download:dl}:undefined).data.publicUrl;
let owner=false,prof={},files=[],tt,pt;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const size=n=>n>1e6?(n/1e6).toFixed(1)+" MB":Math.max(1,Math.round(n/1e3))+" KB";
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("show"),2600)}
/* sections */
const host=$("#sections"),menu=$("#menu");
CATS.forEach(([id,title,desc])=>{
menu.insertAdjacentHTML("beforeend",`<li><a href="#${id}">${title}</a></li>`);
host.insertAdjacentHTML("beforeend",`<section class="blk rv" id="${id}"><h2>${title}</h2><p class="sub">${desc}</p>
<label class="drop" data-c="${id}"><input type="file" multiple hidden><div><b>Upload pictures or files</b><br>Drag and drop here or click to choose. You can add many at once.</div></label>
<div class="grid" id="g-${id}"></div></section>`)});
function stats(){[["s1",files.length],["s2",files.filter(x=>(x.type||"").startsWith("image/")).length],["s3",files.filter(x=>!(x.type||"").startsWith("image/")).length]].forEach(([id,to])=>{const el=$("#"+id),from=+el.textContent,t0=performance.now();(function s(t){const k=Math.min(1,(t-t0)/800);el.textContent=Math.round(from+(to-from)*k);if(k<1)requestAnimationFrame(s)})(t0)})}
function render(){
CATS.forEach(([id])=>{const g=$("#g-"+id),list=files.filter(f=>f.cat===id);g.innerHTML="";
if(!list.length){g.innerHTML='<p class="empty">'+(owner?"Nothing here yet. Upload your first file.":"Nothing here yet.")+'</p>';return}
list.forEach((f,i)=>{
const u=url(f.path),img=(f.type||"").startsWith("image/"),ext=(f.name.split(".").pop()||"file").slice(0,4).toUpperCase();
const el=document.createElement("div");el.className="item";el.style.setProperty("--i",i);
el.innerHTML=`<div class="thumb">${img?`<img src="${u}" alt="" loading="lazy">`:`<span class="ext">${esc(ext)}</span>`}</div>
<div class="meta"><div title="${esc(f.name)}">${esc(f.name)}</div><small>${size(f.size)}</small></div>
<div class="acts">${img?'<button class="view">View</button>':`<a href="${u}" target="_blank" rel="noopener">Open</a>`}<a href="${url(f.path,f.name)}">Save</a><button class="del">Delete</button></div>`;
if(img)el.querySelector(".thumb").onclick=el.querySelector(".view").onclick=()=>{$("#lb img").src=u;$("#lb").classList.add("show")};
el.querySelector(".del").onclick=async()=>{if(!owner||!confirm("Delete this file?"))return;await B().remove([f.path]);const r=await sb.from("files").delete().eq("id",f.id);if(r.error)return toast(r.error.message);load()};
g.appendChild(el)})});stats()}
async function load(){const r=await sb.from("files").select("*").order("id");if(r.error)return toast("Could not load files: "+r.error.message);files=r.data;render()}
async function add(cat,list){if(!owner)return;let ok=0;
for(const f of list){const path=`${cat}/${Date.now()}-${Math.random().toString(36).slice(2,7)}-${f.name.replace(/[^\w.\-]+/g,"_")}`;
const u=await B().upload(path,f,{contentType:f.type||"application/octet-stream"});
if(u.error){toast(f.name+": "+u.error.message);continue}
const r=await sb.from("files").insert({cat,name:f.name,type:f.type||"",size:f.size,path});
if(r.error){toast(r.error.message);continue}ok++}
if(ok)toast(ok+(ok>1?" files":" file")+" saved online");load()}
document.querySelectorAll(".drop").forEach(d=>{
const inp=d.querySelector("input"),c=d.dataset.c;
inp.onchange=()=>{add(c,[...inp.files]);inp.value=""};
["dragenter","dragover"].forEach(e=>d.addEventListener(e,x=>{x.preventDefault();d.classList.add("over")}));
["dragleave","drop"].forEach(e=>d.addEventListener(e,x=>{x.preventDefault();d.classList.remove("over")}));
d.addEventListener("drop",x=>add(c,[...x.dataTransfer.files]))});
$("#lb").onclick=()=>$("#lb").classList.remove("show");
addEventListener("keydown",e=>{if(e.key==="Escape")$("#lb").classList.remove("show")});
/* profile */
function setPic(u){const p=$("#pic");p.querySelector("img")?.remove();const i=document.createElement("img");i.alt="Profile photo";i.src=u;p.appendChild(i)}
async function loadProf(){const r=await sb.from("profile").select("data").eq("id",1).maybeSingle();prof=(r.data&&r.data.data)||{};
document.querySelectorAll("[data-k]").forEach(el=>{if(prof[el.dataset.k])el.textContent=prof[el.dataset.k]});if(prof.pic)setPic(url(prof.pic))}
function saveProf(k,v){prof[k]=v;clearTimeout(pt);pt=setTimeout(async()=>{const r=await sb.from("profile").upsert({id:1,data:prof});toast(r.error?"Could not save: "+r.error.message:"Profile saved")},700)}
$("#picIn").onchange=async e=>{const f=e.target.files[0];if(!f||!owner)return;const p="profile/photo-"+Date.now()+"."+(f.name.split(".").pop()||"jpg");
const r=await B().upload(p,f,{contentType:f.type||"image/jpeg"});if(r.error)return toast(r.error.message);setPic(url(p));saveProf("pic",p)};
$("#pic").onkeydown=e=>{if(e.key==="Enter"&&owner)$("#picIn").click()};
document.querySelectorAll("[data-k]").forEach(el=>{
el.addEventListener("input",()=>owner&&saveProf(el.dataset.k,el.textContent));
el.addEventListener("keydown",e=>{if(e.key==="Enter"&&el.tagName!=="P"){e.preventDefault();el.blur()}})});
/* owner login */
function setOwner(v){owner=v;document.body.classList.toggle("ro",!v);
document.querySelectorAll("[data-k]").forEach(el=>v?el.setAttribute("contenteditable",""):el.removeAttribute("contenteditable"));
$("#login").textContent=v?"Log out":"Owner login";render()}
$("#login").onclick=async()=>{if(owner){await sb.auth.signOut();return}$("#lm").classList.add("show");$("#em").focus()};
$("#lc").onclick=()=>$("#lm").classList.remove("show");
$("#lf").onsubmit=async e=>{e.preventDefault();const r=await sb.auth.signInWithPassword({email:$("#em").value,password:$("#pw").value});
if(r.error){$("#err").textContent=r.error.message;return}$("#lm").classList.remove("show");$("#pw").value="";$("#err").textContent=""};
/* ---------- animation: typing, particles, reveal, active nav ---------- */
const words=["I build things for the web.","I keep every quiz, exam and project here.","Welcome to my portfolio."];
let wi=0,ci=0,del=false;
(function tick(){const t=$("#type"),w=words[wi];t.textContent=w.slice(0,ci);
if(!del&&ci===w.length){del=true;return setTimeout(tick,1600)}
if(del&&ci===0){del=false;wi=(wi+1)%words.length}
ci+=del?-1:1;setTimeout(tick,del?25:55)})();
const cv=$("#fx"),cx=cv.getContext("2d");let P=[],mx=-999,my=-999;
function size2(){cv.width=cv.offsetWidth;cv.height=cv.offsetHeight;P=Array.from({length:Math.min(70,cv.width/16)},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.5,r:Math.random()*2+1}))}
size2();addEventListener("resize",size2);
const still=matchMedia("(prefers-reduced-motion:reduce)").matches;
(function loop(){cx.clearRect(0,0,cv.width,cv.height);const R=cv.getBoundingClientRect();
P.forEach((p,i)=>{if(!still){p.x+=p.vx;p.y+=p.vy}
const dx=p.x-(mx-R.left),dy=p.y-(my-R.top),dd=Math.hypot(dx,dy);
if(dd>0&&dd<160){if(!still&&dd<110){p.x+=dx/dd*1.5;p.y+=dy/dd*1.5}cx.strokeStyle="rgba(76,201,255,"+(1-dd/160)+")";cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(mx-R.left,my-R.top);cx.stroke()}
if(p.x<0||p.x>cv.width)p.vx*=-1;if(p.y<0||p.y>cv.height)p.vy*=-1;
cx.fillStyle="#4cc9ff";cx.beginPath();cx.arc(p.x,p.y,p.r,0,7);cx.fill();
for(let j=i+1;j<P.length;j++){const d=Math.hypot(p.x-P[j].x,p.y-P[j].y);
if(d<120){cx.strokeStyle=`rgba(47,107,255,${1-d/120})`;cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(P[j].x,P[j].y);cx.stroke()}}});
requestAnimationFrame(loop)})();
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add("in")}),{threshold:.08});
document.querySelectorAll(".rv").forEach(s=>io.observe(s));
const links=[...menu.querySelectorAll("a")];
const so=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle("on",a.getAttribute("href")==="#"+e.target.id))}),{rootMargin:"-45% 0px -50% 0px"});
document.querySelectorAll("header,section").forEach(s=>so.observe(s));
addEventListener("scroll",()=>{$("#bar").style.width=scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)*100+"%"},{passive:true});
addEventListener("pointermove",e=>{mx=e.clientX;my=e.clientY;const g=$("#glow");g.style.left=mx+"px";g.style.top=my+"px"});
host.addEventListener("pointermove",e=>{const it=e.target.closest(".item");if(!it)return;const b=it.getBoundingClientRect();it.style.setProperty("--ry",((e.clientX-b.left)/b.width-.5)*14+"deg");it.style.setProperty("--rx",-((e.clientY-b.top)/b.height-.5)*14+"deg")});
host.addEventListener("mouseout",e=>{const it=e.target.closest(".item");if(it&&!it.contains(e.relatedTarget)){it.style.setProperty("--rx","0deg");it.style.setProperty("--ry","0deg")}});

setOwner(false);
if(sb){sb.auth.onAuthStateChange((_e,s)=>setOwner(!!s));loadProf();load()}
else{document.body.insertAdjacentHTML("afterbegin",'<div id="setup">Online saving is not connected yet. Open config.js and follow README.txt.</div>');$("#login").style.display="none"}
