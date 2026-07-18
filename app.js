const STORAGE_KEY = "golfDesignShirts";
const categoryNames = { football: "ເສື້ອກິລາ", team: "ເສື້ອທິມງານ", company: "ເສື້ອບໍລິສັດ", meme: "ເສື້ອມີມ" };
const statusNames = { available: "ພ້ອມຜະລິດ", draft: "ແບບຮ່າງ", soldout: "ປິດຮັບ" };

/*const defaultShirts = [
  {id:"1",name:"เสื้อฟุตบอลสายฟ้าน้ำเงิน",category:"football",date:"2026-07-18",code:"GD-FB-001",color:"น้ำเงิน / ขาว",status:"available",tags:"ฟุตบอล สายฟ้า น้ำเงิน",description:"เสื้อฟุตบอลลายสายฟ้า ทรงสปอร์ต เหมาะสำหรับทีมแข่งขัน",featured:true,image:"https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=85"},
  {id:"2",name:"เสื้อทีมงานสีดำทอง",category:"team",date:"2026-07-16",code:"GD-TM-014",color:"ดำ / ทอง",status:"available",tags:"ทีมงาน ดำ ทอง",description:"แบบเรียบหรูสำหรับทีมงาน อีเวนต์ และสตาฟ",featured:false,image:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85"},
  {id:"3",name:"เสื้อบริษัทคอปก",category:"company",date:"2026-07-14",code:"GD-CP-008",color:"กรมท่า",status:"available",tags:"บริษัท คอปก โปโล",description:"เสื้อบริษัทดูเป็นทางการ ใส่โลโก้หน้าอกและชื่อแผนกได้",featured:true,image:"https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=800&q=85"},
  {id:"4",name:"เสื้อมีมสายฮา",category:"meme",date:"2026-07-12",code:"GD-MM-003",color:"ขาว / ดำ",status:"draft",tags:"มีม ตลก การ์ตูน",description:"เสื้อกราฟิกมีมสำหรับกลุ่มเพื่อนและคอนเทนต์ออนไลน์",featured:false,image:"https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=85"}
];*/

function getShirts() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) { localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultShirts)); return defaultShirts; }
  try { return JSON.parse(saved) } catch { return defaultShirts }
}
function saveShirts(items) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) }
function formatDate(value) { return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value + "T00:00:00")) }
function escapeHtml(text = "") { return String(text).replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c])) }

function initGallery() {
  const grid = document.querySelector("#shirtGallery"); if (!grid) return;
  const search = document.querySelector("#gallerySearch"), sort = document.querySelector("#sortSelect"), count = document.querySelector("#resultCount"), empty = document.querySelector("#emptyState");
  let active = "all";
  document.querySelectorAll("#categoryFilters button").forEach(btn => btn.addEventListener("click", () => { document.querySelectorAll("#categoryFilters button").forEach(b => b.classList.remove("active")); btn.classList.add("active"); active = btn.dataset.category; render() }));
  search.addEventListener("input", render); sort.addEventListener("change", render);
  function render() {
    const q = search.value.trim().toLowerCase();
    let items = getShirts().filter(x => (active === "all" || x.category === active) && (!q || [x.name, x.code, x.tags, x.description, x.color].join(" ").toLowerCase().includes(q)));
    items.sort((a, b) => sort.value === "oldest" ? a.date.localeCompare(b.date) : sort.value === "name" ? a.name.localeCompare(b.name, "th") : b.date.localeCompare(a.date));
    count.textContent = items.length; empty.hidden = items.length > 0;
    grid.innerHTML = items.map(x => `<article class="shirt-item"><div class="shirt-thumb"><img src="${escapeHtml(x.image)}" alt="${escapeHtml(x.name)}" loading="lazy"><span class="shirt-category">${categoryNames[x.category] || escapeHtml(x.category)}</span>${x.featured ? '<span class="shirt-featured">ແນະນຳ</span>' : ''}</div><div class="shirt-meta"><h3>${escapeHtml(x.name)}</h3><p class="shirt-code">${escapeHtml(x.code || "ບໍ່ມີລະຫັດແບບ")}</p><p class="shirt-description">${escapeHtml(x.description || "ບໍ່ມີລາຍລະອຽດ")}</p><div class="shirt-details"><span>${formatDate(x.date)}</span><span>${escapeHtml(x.color || "ບໍ່ລະບຸສີ")}</span></div><span class="status-pill ${escapeHtml(x.status)}">${statusNames[x.status] || escapeHtml(x.status)}</span></div></article>`).join("");
  }
  render();
}

async function uploadToCloudinary(file, metadata) {
  const config = window.CLOUDINARY_CONFIG || {};
  if (!config.cloudName || !config.uploadPreset || config.cloudName.includes("ໃສ່-") || config.uploadPreset.includes("ໃສ່-")) {
    throw new Error("ຍັງບໍ່ได້ຕັ້ງຄ່າ Cloudinary ໃນໄຟລ໌ cloudinary-config.js");
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", config.uploadPreset);
  if (config.folder) formData.append("folder", config.folder);
  if (metadata.tags) formData.append("tags", metadata.tags);

  const response = await fetch(endpoint, { method: "POST", body: formData });
  const result = await response.json();
  if (!response.ok) { throw new Error(result.error?.message || "ອັບໂຫລດໄປ Cloudinary ບໍ่ສຳເລັດ") }
  return result;
}

function initUpload() {
  const form = document.querySelector("#uploadForm"); if (!form) return;
  const file = document.querySelector("#shirtImage"), preview = document.querySelector("#previewImage"), text = document.querySelector("#dropzoneText"), dropzone = document.querySelector("#dropzone"), date = document.querySelector("#uploadDate"), message = document.querySelector("#formMessage"), submitButton = form.querySelector('button[type="submit"]');
  date.value = new Date().toISOString().slice(0, 10);

  function previewFile(selected) {
    if (!selected) return;
    message.textContent = "";
    if (!selected.type.startsWith("image/")) { message.textContent = "ກະລຸນາເລືອກໄຟລ໌ຮູບເທົ່ານັ້ນ"; file.value = ""; return }
    if (selected.size > 10 * 1024 * 1024) { message.textContent = "ໄຟລ໌ໃຫຍ່ເກີນ 10 MB"; file.value = ""; return }
    const objectUrl = URL.createObjectURL(selected);
    preview.src = objectUrl; preview.hidden = false; text.hidden = true;
  }

  file.addEventListener("change", () => previewFile(file.files[0]));
  ["dragenter", "dragover"].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add("dragover") }));
  ["dragleave", "drop"].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove("dragover") }));
  dropzone.addEventListener("drop", e => { const selected = e.dataTransfer.files[0]; if (selected && selected.type.startsWith("image/")) { const dt = new DataTransfer(); dt.items.add(selected); file.files = dt.files; previewFile(selected) } });
  form.addEventListener("reset", () => setTimeout(() => { preview.hidden = true; preview.removeAttribute("src"); text.hidden = false; message.textContent = ""; date.value = new Date().toISOString().slice(0, 10) }, 0));

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const selectedFile = file.files[0];
    if (!selectedFile) { message.textContent = "ກະລຸນາເລືອກຮູບເສື້ອ"; return }

    submitButton.disabled = true;
    submitButton.textContent = "ກຳລັງອັບໂຫລດ...";
    message.textContent = "ກຳລັງສົ່ງຮູບພາບຂຶ້ນ Cloudinary ກະລຸນາຢ່າປິດໜ້ານີ້";

    try {
      const name = document.querySelector("#shirtName").value.trim();
      const tags = document.querySelector("#shirtTags").value.trim();
      const cloudinaryResult = await uploadToCloudinary(selectedFile, { name, tags });

      const item = {
        id: String(Date.now()),
        name,
        category: document.querySelector("#shirtCategory").value,
        date: date.value,
        code: document.querySelector("#designCode").value.trim(),
        color: document.querySelector("#mainColor").value.trim(),
        status: document.querySelector("#shirtStatus").value,
        tags,
        description: document.querySelector("#shirtDescription").value.trim(),
        featured: document.querySelector("#featured").checked,
        image: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        bytes: cloudinaryResult.bytes,
        format: cloudinaryResult.format
      };

      const items = getShirts(); items.unshift(item); saveShirts(items);
      message.textContent = "ອັບໂຫລດສຳເລັດ ກຳລັງເປິດໜ້າແບບເສື້ອ...";
      setTimeout(() => { window.location.href = "gallery.html" }, 700);
    } catch (err) {
      console.error(err);
      message.textContent = err.message || "ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "ບັນທຶກແບບເສື້ອ";
    }
  });
}

initGallery();
initUpload();
