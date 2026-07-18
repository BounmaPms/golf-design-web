const STORAGE_KEY = "golfDesignShirts";
const categoryNames = { football: "เสื้อกีฬาฟุตบอล", team: "เสื้อทีมงาน", company: "เสื้อบริษัท", meme: "เสื้อมีม" };
const statusNames = { available: "พร้อมสั่งผลิต", draft: "แบบร่าง", soldout: "ปิดรับแบบนี้" };

const defaultShirts = [
  {id:"1",name:"เสื้อฟุตบอลสายฟ้าน้ำเงิน",category:"football",date:"2026-07-18",code:"GD-FB-001",color:"น้ำเงิน / ขาว",status:"available",tags:"ฟุตบอล สายฟ้า น้ำเงิน",description:"เสื้อฟุตบอลลายสายฟ้า ทรงสปอร์ต เหมาะสำหรับทีมแข่งขัน",featured:true,image:"https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=85"},
  {id:"2",name:"เสื้อทีมงานสีดำทอง",category:"team",date:"2026-07-16",code:"GD-TM-014",color:"ดำ / ทอง",status:"available",tags:"ทีมงาน ดำ ทอง",description:"แบบเรียบหรูสำหรับทีมงาน อีเวนต์ และสตาฟ",featured:false,image:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85"},
  {id:"3",name:"เสื้อบริษัทคอปก",category:"company",date:"2026-07-14",code:"GD-CP-008",color:"กรมท่า",status:"available",tags:"บริษัท คอปก โปโล",description:"เสื้อบริษัทดูเป็นทางการ ใส่โลโก้หน้าอกและชื่อแผนกได้",featured:true,image:"https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=800&q=85"},
  {id:"4",name:"เสื้อมีมสายฮา",category:"meme",date:"2026-07-12",code:"GD-MM-003",color:"ขาว / ดำ",status:"draft",tags:"มีม ตลก การ์ตูน",description:"เสื้อกราฟิกมีมสำหรับกลุ่มเพื่อนและคอนเทนต์ออนไลน์",featured:false,image:"https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=85"},
  {id:"5",name:"เสื้อฟุตบอลมังกรแดง",category:"football",date:"2026-07-10",code:"GD-FB-019",color:"แดง / ดำ",status:"available",tags:"ฟุตบอล มังกร แดง",description:"ลายมังกรพาดเต็มตัว พร้อมตำแหน่งชื่อและเบอร์ด้านหลัง",featured:false,image:"https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=85"},
  {id:"6",name:"เสื้อทีมงานกิจกรรม",category:"team",date:"2026-07-08",code:"GD-TM-021",color:"ฟ้า / ขาว",status:"soldout",tags:"ทีมงาน กิจกรรม ฟ้า",description:"ลายสะอาด อ่านชื่อทีมชัด เหมาะสำหรับงานภาคสนาม",featured:false,image:"https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=800&q=85"}
];
function getShirts(){const saved=localStorage.getItem(STORAGE_KEY);if(!saved){localStorage.setItem(STORAGE_KEY,JSON.stringify(defaultShirts));return defaultShirts;}try{return JSON.parse(saved)}catch{return defaultShirts}}
function saveShirts(items){localStorage.setItem(STORAGE_KEY,JSON.stringify(items))}
function formatDate(value){return new Intl.DateTimeFormat("th-TH",{day:"numeric",month:"short",year:"numeric"}).format(new Date(value+"T00:00:00"))}
function escapeHtml(text=""){return text.replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}

function initGallery(){
  const grid=document.querySelector("#shirtGallery"); if(!grid)return;
  const search=document.querySelector("#gallerySearch"), sort=document.querySelector("#sortSelect"), count=document.querySelector("#resultCount"), empty=document.querySelector("#emptyState");
  let active="all";
  document.querySelectorAll("#categoryFilters button").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("#categoryFilters button").forEach(b=>b.classList.remove("active"));btn.classList.add("active");active=btn.dataset.category;render()}));
  search.addEventListener("input",render); sort.addEventListener("change",render);
  function render(){
    const q=search.value.trim().toLowerCase();
    let items=getShirts().filter(x=>(active==="all"||x.category===active)&&(!q||[x.name,x.code,x.tags,x.description,x.color].join(" ").toLowerCase().includes(q)));
    items.sort((a,b)=>sort.value==="oldest"?a.date.localeCompare(b.date):sort.value==="name"?a.name.localeCompare(b.name,"th"):b.date.localeCompare(a.date));
    count.textContent=items.length; empty.hidden=items.length>0;
    grid.innerHTML=items.map(x=>`<article class="shirt-item"><div class="shirt-thumb"><img src="${x.image}" alt="${escapeHtml(x.name)}"><span class="shirt-category">${categoryNames[x.category]||x.category}</span>${x.featured?'<span class="shirt-featured">แนะนำ</span>':''}</div><div class="shirt-meta"><h3>${escapeHtml(x.name)}</h3><p class="shirt-code">${escapeHtml(x.code||"ไม่มีรหัสแบบ")}</p><p class="shirt-description">${escapeHtml(x.description||"ไม่มีรายละเอียด")}</p><div class="shirt-details"><span>${formatDate(x.date)}</span><span>${escapeHtml(x.color||"ไม่ระบุสี")}</span></div><span class="status-pill ${x.status}">${statusNames[x.status]||x.status}</span></div></article>`).join("");
  }
  render();
}

function initUpload(){
  const form=document.querySelector("#uploadForm"); if(!form)return;
  const file=document.querySelector("#shirtImage"), preview=document.querySelector("#previewImage"), text=document.querySelector("#dropzoneText"), dropzone=document.querySelector("#dropzone"), date=document.querySelector("#uploadDate"), message=document.querySelector("#formMessage");
  date.value=new Date().toISOString().slice(0,10); let imageData="";
  function previewFile(selected){if(!selected)return;if(selected.size>5*1024*1024){message.textContent="ไฟล์ใหญ่เกิน 5 MB";file.value="";return}const reader=new FileReader();reader.onload=e=>{imageData=e.target.result;preview.src=imageData;preview.hidden=false;text.hidden=true};reader.readAsDataURL(selected)}
  file.addEventListener("change",()=>previewFile(file.files[0]));
  ["dragenter","dragover"].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.classList.add("dragover")}));
  ["dragleave","drop"].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.classList.remove("dragover")}));
  dropzone.addEventListener("drop",e=>{const selected=e.dataTransfer.files[0];if(selected&&selected.type.startsWith("image/")){const dt=new DataTransfer();dt.items.add(selected);file.files=dt.files;previewFile(selected)}});
  form.addEventListener("reset",()=>setTimeout(()=>{preview.hidden=true;text.hidden=false;imageData="";message.textContent="";date.value=new Date().toISOString().slice(0,10)},0));
  form.addEventListener("submit",e=>{e.preventDefault();if(!imageData){message.textContent="กรุณาเลือกภาพเสื้อ";return}const item={id:String(Date.now()),name:document.querySelector("#shirtName").value.trim(),category:document.querySelector("#shirtCategory").value,date:date.value,code:document.querySelector("#designCode").value.trim(),color:document.querySelector("#mainColor").value.trim(),status:document.querySelector("#shirtStatus").value,tags:document.querySelector("#shirtTags").value.trim(),description:document.querySelector("#shirtDescription").value.trim(),featured:document.querySelector("#featured").checked,image:imageData};const items=getShirts();items.unshift(item);try{saveShirts(items);message.textContent="บันทึกแบบเสื้อเรียบร้อยแล้ว สามารถเปิดหน้าแกลเลอรีเพื่อตรวจสอบได้";form.reset()}catch(err){message.textContent="พื้นที่เก็บข้อมูลเต็ม กรุณาใช้ภาพขนาดเล็กลงหรือลบข้อมูลเก่า"}})
}
initGallery();initUpload();
