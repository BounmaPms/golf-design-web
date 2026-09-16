const CLOUDINARY_LIST_TAG = "golf-design-shirts";
const DELETED_IMAGES_KEY = "deletedCloudinaryImages";
const WHATSAPP_NUMBER = "8562093529729";

function getDeletedImageIds() {
  try {
    const saved = localStorage.getItem(DELETED_IMAGES_KEY);
    const items = saved ? JSON.parse(saved) : [];

    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.error("อ่านรายการรูปที่ลบไม่สำเร็จ:", error);
    return [];
  }
}

function rememberDeletedImage(publicId) {
  if (!publicId) return;

  const deletedIds = getDeletedImageIds();

  if (!deletedIds.includes(publicId)) {
    deletedIds.push(publicId);
  }

  localStorage.setItem(DELETED_IMAGES_KEY, JSON.stringify(deletedIds));
}

const categoryNames = {
  football: "ເສື້ອກິລາ",
  team: "ເສື້ອທີມງານ",
  company: "ເສື້ອບໍລິສັດ",
  meme: "ເສື້ອມີມ",
};

const collarNames = {
  round: "ຄໍມົນ",
  "v-neck": "ຄໍວີ",
  "cross-v": "ຄໍວີໄຂວ້",
  "cut-v": "ຄໍວີຕັດ",
  pentagon: "ຄໍ 5 ຫຼ່ຽມ",
  "pentagon-placket": "ຄໍ 5 ຫຼ່ຽມມີສາບໃນ",
  "pig-neck": "ຄໍຄາງໝູ",
  "y-neck": "ຄໍວາຍ",
  "cross-polo-v": "ຄໍວີປົກໄຂວ້",
  "polo-v": "ຄໍວີປົກ",
  polo: "ຄໍໂປໂລ",
  mandarin: "ຄໍຈີນ",
  "y-polo": "ຄໍວາຍປົກ",
};

const sleeveNames = {
  short: "ແຂນສັ້ນ",
  long: "ແຂນຍາວ",
};

const shoulderNames = {
  normal: "ໄຫຼ່ປົກກະຕິ",
  raglan: "ໄຫຼ່ສະຫຼົບ",
};

const colorValues = {
  white: "#ffffff",
  black: "#111111",
  red: "#e1262f",
  blue: "#164dcc",
  sky: "#43baf5",
  green: "#199451",
  yellow: "#ffd52b",
  orange: "#ff7a22",
  pink: "#f16aaa",
  purple: "#783cbd",
  gray: "#929292",
};

const colorNames = {
  white: "ສີຂາວ",
  black: "ສີດຳ",
  red: "ສີແດງ",
  blue: "ສີນ້ຳເງິນ",
  sky: "ສີຟ້າ",
  green: "ສີຂຽວ",
  yellow: "ສີເຫຼືອງ",
  orange: "ສີສົ້ມ",
  pink: "ສີບົວ",
  purple: "ສີມ່ວງ",
  gray: "ສີເທົາ",
};

const premiumCollars = ["cross-polo-v", "polo-v", "polo", "mandarin", "y-polo"];

function calculateShirtPrice(collar, sleeve) {
  let price = premiumCollars.includes(collar) ? 195000 : 175000;

  if (sleeve === "long") {
    price += 20000;
  }

  return price;
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString("en-US");
}

function getSelectedShirtColors() {
  return Array.from(
    document.querySelectorAll('input[name="shirtColors"]:checked'),
  ).map((input) => input.value);
}

function initColorSorting(initialColors = []) {
  const container = document.querySelector("#selectedColorOrder");

  if (!container) return;

  let orderedColors = Array.isArray(initialColors) ? [...initialColors] : [];

  function getCheckedColors() {
    return Array.from(
      document.querySelectorAll('input[name="shirtColors"]:checked'),
    ).map((input) => input.value);
  }

  function syncColorOrder() {
    const checkedColors = getCheckedColors();

    // ลบสีที่ยกเลิกเลือกออก
    orderedColors = orderedColors.filter((color) =>
      checkedColors.includes(color),
    );

    // เพิ่มสีที่เพิ่งเลือกไว้ท้ายรายการ
    checkedColors.forEach((color) => {
      if (!orderedColors.includes(color)) {
        orderedColors.push(color);
      }
    });

    renderColorOrder();
  }

  function renderColorOrder() {
    if (orderedColors.length === 0) {
      container.innerHTML = `
        <span class="color-order-empty">
          ຍັງບໍ່ໄດ້ເລືອກສີ
        </span>
      `;
      return;
    }

    container.innerHTML = orderedColors
      .map(
        (color) => `
      <div
        class="sortable-color-item"
        data-color="${escapeHtml(color)}"
      >
        <span
          class="sortable-color-dot"
          style="background:${colorValues[color] || "#cccccc"}"
        ></span>

        <span class="sortable-color-name">
          ${colorNames[color] || escapeHtml(color)}
        </span>

        <span class="sortable-color-handle">☰</span>
      </div>
    `,
      )
      .join("");
  }

  document.querySelectorAll('input[name="shirtColors"]').forEach((input) => {
    input.addEventListener("change", syncColorOrder);
  });

  if (typeof Sortable !== "undefined") {
    new Sortable(container, {
      animation: 150,
      handle: ".sortable-color-handle",
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",

      onEnd() {
        orderedColors = Array.from(
          container.querySelectorAll(".sortable-color-item"),
        ).map((item) => item.dataset.color);
      },
    });
  }

  window.getOrderedShirtColors = function () {
    const items = Array.from(
      container.querySelectorAll(".sortable-color-item"),
    );

    if (items.length > 0) {
      return items.map((item) => item.dataset.color);
    }

    return [];
  };

  syncColorOrder();
}

function initPriceCalculator() {
  const collarSelect = document.querySelector("#shirtCollar");

  const sleeveSelect = document.querySelector("#shirtSleeve");

  const priceInput = document.querySelector("#shirtPrice");

  const priceText = document.querySelector("#calculatedPrice");

  if (!collarSelect || !sleeveSelect || !priceInput || !priceText) {
    return;
  }

  function updatePrice() {
    const price = calculateShirtPrice(collarSelect.value, sleeveSelect.value);

    priceInput.value = String(price);
    priceText.textContent = formatPrice(price);
  }

  collarSelect.addEventListener("change", updatePrice);
  sleeveSelect.addEventListener("change", updatePrice);

  updatePrice();
}

async function getShirtsFromSupabase() {
  if (!window.supabaseClient) {
    throw new Error("Supabase ຍັງບໍ່ເຊື່ອມຕໍ່");
  }

  const { data, error } = await window.supabaseClient
    .from("shirts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("ດຶງຂໍ້ມູນຈາກ Supabase ບໍ່ສຳເລັດ:", error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

async function getGalleryShirtsFromSupabase() {
  const items = await getShirtsFromSupabase();

  console.log("ข้อมูลดิบจาก Supabase:", items);

  return items
    .filter((item) => item.image && item.cloudinary_public_id)
    .map((item) => ({
      id: item.id,
      name: item.name || "ບໍ່ມີຊື່",
      category: item.category || "football",
      date: item.upload_date || "",
      code: item.design_code || "",
      color: item.main_color || "",
      tags: item.tags || "",
      description: item.description || "",
      featured: item.featured === true,
      collar: item.collar || "",
      sleeve: item.sleeve || "",
      shoulder: item.shoulder || "",
      colors: Array.isArray(item.colors) ? item.colors : [],
      price: Number(item.price || 0),
      relatedShirtIds: Array.isArray(item.related_shirt_ids)
        ? item.related_shirt_ids.map(String)
        : [],
      image: item.image || "",
      cloudinaryPublicId: item.cloudinary_public_id || "",
      width: item.width || null,
      height: item.height || null,
      bytes: item.bytes || null,
      format: item.format || "",
    }));
}

async function saveShirtToSupabase(item) {
  const { data, error } = await window.supabaseClient
    .from("shirts")
    .insert([
      {
        name: item.name,
        category: item.category,
        upload_date: item.date,
        design_code: item.code,
        main_color: item.color,
        tags: item.tags,
        description: item.description,
        featured: item.featured,
        collar: item.collar,
        sleeve: item.sleeve,
        shoulder: item.shoulder,
        colors: item.colors,
        price: item.price,
        related_shirt_ids: Array.isArray(item.relatedShirtIds)
          ? item.relatedShirtIds
          : [],
        image: item.image,
        cloudinary_public_id: item.cloudinaryPublicId,
        width: item.width,
        height: item.height,
        bytes: item.bytes,
        format: item.format,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data;
}

async function importCloudinaryImagesToSupabase() {
  const cloudinaryItems = await getCloudinaryShirts();
  const supabaseItems = await getShirtsFromSupabase();

  console.log("ข้อมูล Gallery:", cloudinaryItems);
  console.log("จำนวนข้อมูล Gallery:", cloudinaryItems.length);

  const existingPublicIds = new Set(
    supabaseItems.map((item) => item.cloudinary_public_id).filter(Boolean),
  );

  const missingItems = cloudinaryItems.filter(
    (item) =>
      item.cloudinaryPublicId &&
      !existingPublicIds.has(item.cloudinaryPublicId),
  );

  console.log("รูปที่ต้องนำเข้า:", missingItems.length);

  for (const item of missingItems) {
    try {
      await saveShirtToSupabase({
        name: item.name || "ไม่มีชื่อ",
        category: item.category || "football",
        date: item.date || new Date().toISOString().slice(0, 10),
        code: item.code || "",
        color: item.color || "",
        tags: item.tags || "",
        description: item.description || "",
        featured: item.featured === true,

        collar: item.collar || "round",
        sleeve: item.sleeve || "short",
        shoulder: item.shoulder || "normal",
        colors: Array.isArray(item.colors) ? item.colors : [],
        price: Number(item.price || 0),

        relatedShirtIds: Array.isArray(item.related_shirt_ids)
          ? item.related_shirt_ids.map(String)
          : [],

        image: item.image,
        cloudinaryPublicId: item.cloudinaryPublicId,

        width: item.width || null,
        height: item.height || null,
        bytes: item.bytes || null,
        format: item.format || "",
      });

      console.log("นำเข้าสำเร็จ:", item.name);
    } catch (error) {
      console.error("นำเข้าไม่สำเร็จ:", item.name, error);
    }
  }

  console.log("นำเข้ารูปเก่าเสร็จแล้ว");
}

/* =====================================================
   HELPERS
===================================================== */

function formatDate(dateString) {
  if (!dateString) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
}

function escapeHtml(text = "") {
  return String(text).replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character],
  );
}

function getFileNameFromPublicId(publicId = "") {
  const fileName = publicId.split("/").pop() || "Cloudinary image";

  return fileName.replace(/[-_]+/g, " ").trim();
}

function buildCloudinaryImageUrl(cloudName, resource) {
  if (resource.secure_url) {
    return resource.secure_url;
  }

  const version = resource.version ? `v${resource.version}/` : "";

  const format = resource.format ? `.${resource.format}` : "";

  const publicId = String(resource.public_id || "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return (
    `https://res.cloudinary.com/${encodeURIComponent(cloudName)}` +
    `/image/upload/f_auto,q_auto/${version}${publicId}${format}`
  );
}

/* =====================================================
   GET IMAGES FROM CLOUDINARY
===================================================== */

async function getCloudinaryShirts() {
  const config = window.CLOUDINARY_CONFIG || {};

  if (!config.cloudName) {
    throw new Error("ບໍ່ພົບ Cloud Name ໃນໄຟລ໌ cloudinary-config.js");
  }

  const listUrl =
    `https://res.cloudinary.com/${encodeURIComponent(config.cloudName)}` +
    `/image/list/${encodeURIComponent(CLOUDINARY_LIST_TAG)}.json`;

  const response = await fetch(`${listUrl}?t=${Date.now()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        `ບໍ່ພົບລາຍການຮູບ Cloudinary ທີ່ມີ Tag "${CLOUDINARY_LIST_TAG}". ` +
        "ກວດສອບວ່າເປີດ Client-side asset lists ແລ້ວ ແລະ ຮູບມີ Tag ນີ້",
      );
    }

    throw new Error(`ດຶງຮູບຈາກ Cloudinary ບໍ່ສຳເລັດ (${response.status})`);
  }

  const result = await response.json();
  const deletedIds = getDeletedImageIds();

  const resources = Array.isArray(result.resources)
    ? result.resources.filter(
      (resource) => !deletedIds.includes(resource.public_id),
    )
    : [];

  const localItems = await getShirtsFromSupabase();

  return resources.map((resource, index) => {
    const localItem = localItems.find(
      (item) =>
        item.cloudinary_public_id === resource.public_id ||
        item.image === resource.secure_url,
    );

    const createdDate = resource.created_at
      ? resource.created_at.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    return {
      id: localItem?.id || resource.public_id || `cloudinary-${index}`,

      name:
        localItem?.name ||
        resource.context?.custom?.name ||
        getFileNameFromPublicId(resource.public_id),

      category:
        localItem?.category || resource.context?.custom?.category || "football",

      date: localItem?.upload_date || createdDate,

      code: localItem?.design_code || resource.context?.custom?.code || "",

      color: localItem?.main_color || resource.context?.custom?.color || "",

      tags:
        localItem?.tags ||
        (Array.isArray(resource.tags) ? resource.tags.join(" ") : ""),

      description:
        localItem?.description || resource.context?.custom?.description || "",

      featured: localItem?.featured === true,

      collar: localItem?.collar || "",

      sleeve: localItem?.sleeve || "",

      shoulder: localItem?.shoulder || "",

      colors: localItem?.colors || [],

      price: localItem?.price || 0,

      image: buildCloudinaryImageUrl(config.cloudName, resource),

      cloudinaryPublicId: resource.public_id,
      width: resource.width,
      height: resource.height,
      bytes: resource.bytes,
      format: resource.format,
    };
  });
}

function createWhatsAppOrderUrl(item) {
  const phone = String(WHATSAPP_NUMBER || "").replace(/\D/g, "");

  const shirtKey = item.cloudinaryPublicId || item.id;

  const modalUrl = new URL("gallery.html", window.location.href);
  modalUrl.searchParams.set("shirt", shirtKey);
  modalUrl.searchParams.set("source", "whatsapp");

  const message = [
    "ສະບາຍດີ GOLF DESIGN",
    "",
    "ຂ້ອຍສົນໃຈແບບເສື້ອນີ້",
    `ຊື່ແບບ: ${item.name || "-"}`,
    `ລະຫັດແບບ: ${item.code || "-"}`,
    `ເບິ່ງແບບເສື້ອ: ${modalUrl.href}`,
    "",
    "ກະລຸນາແຈ້ງລາຄາ ແລະ ລາຍລະອຽດໃຫ້ແດ່",
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

async function trackAnalyticsEvent(eventType, item) {
  if (!window.supabaseClient) {
    console.warn("ບໍ່ເຫັນ Supabase Client");
    return;
  }

  if (!eventType || !item) {
    return;
  }

  try {
    const eventData = {
      event_type: eventType,

      shirt_id:
        item.id !== undefined && item.id !== null ? String(item.id) : null,

      shirt_name: item.name || null,
    };

    const { error } = await window.supabaseClient
      .from("analytics_events")
      .insert(eventData);

    if (error) {
      throw error;
    }
  } catch (error) {
    // การนับสถิติล้มเหลวต้องไม่ทำให้ Gallery ใช้งานไม่ได้
    console.warn("ບັນທຶກ Analytics ບໍ່ສຳເລັດ:", eventType, error);
  }
}

/* =====================================================
   GALLERY
===================================================== */

async function initGallery() {
  const grid = document.querySelector("#shirtGallery");

  if (!grid) {
    return;
  }

  const search = document.querySelector("#gallerySearch");
  const sort = document.querySelector("#sortSelect");
  const count = document.querySelector("#resultCount");
  const empty = document.querySelector("#emptyState");

  const modal = document.querySelector("#shirtModal");
  const modalCloseButton = document.querySelector("#closeShirtModal");

  const modalImage = document.querySelector("#modalShirtImage");
  const modalName = document.querySelector("#modalShirtName");
  const modalCategory = document.querySelector("#modalShirtCategory");
  const modalCode = document.querySelector("#modalShirtCode");
  const modalDate = document.querySelector("#modalShirtDate");
  const modalColor = document.querySelector("#modalShirtColor");
  const modalTags = document.querySelector("#modalShirtTags");
  const relatedShirts = document.querySelector("#relatedShirts");
  const modalOpenImage = document.querySelector("#modalOpenImage");
  const modalEditShirt = document.querySelector("#modalEditShirt");
  const modalWhatsApp = document.querySelector("#modalWhatsApp");

  let activeModalItem = null;
  let activeCategory = "all";
  let cloudinaryItems = [];

  const urlParams = new URLSearchParams(window.location.search);

  const whatsappSource =
    urlParams.get("source") === "whatsapp";

  const deepLinkShirt =
    urlParams.get("shirt");

  let skipDeepLinkModalAnalytics = whatsappSource && !!deepLinkShirt;

  const sidebarInputs = document.querySelectorAll(".filter-sidebar input");

  const resetSidebarFilters = document.querySelector("#resetSidebarFilters");

  sidebarInputs.forEach((input) => {
    input.addEventListener("change", render);
  });

  resetSidebarFilters?.addEventListener("click", () => {
    document
      .querySelectorAll('.filter-sidebar input[type="checkbox"]')
      .forEach((input) => {
        input.checked = false;
      });

    render();
  });

  grid.innerHTML = `
    <div class="empty-state">
      <h3>ກຳລັງໂຫລດຮູບ...</h3>
      <p>ກຳລັງດຶງຮູບພາບຈາກ Supabase</p>
    </div>
  `;

  try {
    cloudinaryItems = await getGalleryShirtsFromSupabase();
  } catch (error) {
    console.error(error);

    grid.innerHTML = `
      <div class="empty-state">
        <h3>ດຶງຂໍ້ມູນຈາກ Supabase ບໍ່ສຳເລັດ</h3>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;

    count.textContent = "0";
    return;
  }

  document.querySelectorAll("#categoryFilters button").forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll("#categoryFilters button")
        .forEach((item) => item.classList.remove("active"));

      button.classList.add("active");
      activeCategory = button.dataset.category;
      render();
    });
  });

  search?.addEventListener("input", render);
  sort?.addEventListener("change", render);

  const isAdminGallery = document.body.dataset.page === "gallery-admin";

  function render() {
    const query = search?.value.trim().toLowerCase() || "";

    const selectedCollars = Array.from(
      document.querySelectorAll('input[name="collarFilter"]:checked'),
    ).map((input) => input.value);

    const selectedSleeves = Array.from(
      document.querySelectorAll('input[name="sleeveFilter"]:checked'),
    ).map((input) => input.value);

    const selectedShoulders = Array.from(
      document.querySelectorAll('input[name="shoulderFilter"]:checked'),
    ).map((input) => input.value);

    const selectedColors = Array.from(
      document.querySelectorAll('input[name="colorFilter"]:checked'),
    ).map((input) => input.value);

    let items = cloudinaryItems.filter((item) => {
      const categoryMatches =
        activeCategory === "all" || item.category === activeCategory;

      const searchableText = [
        item.name,
        item.code,
        item.tags,
        item.description,
        item.color,
        item.cloudinaryPublicId,
      ]
        .join(" ")
        .toLowerCase();

      const searchMatches = !query || searchableText.includes(query);

      const collarMatches =
        selectedCollars.length === 0 || selectedCollars.includes(item.collar);

      const sleeveMatches =
        selectedSleeves.length === 0 || selectedSleeves.includes(item.sleeve);

      const shoulderMatches =
        selectedShoulders.length === 0 ||
        selectedShoulders.includes(item.shoulder);

      const itemColors = Array.isArray(item.colors) ? item.colors : [];

      const colorMatches =
        selectedColors.length === 0 ||
        selectedColors.some((color) => itemColors.includes(color));

      return (
        categoryMatches &&
        searchMatches &&
        collarMatches &&
        sleeveMatches &&
        shoulderMatches &&
        colorMatches
      );
    });

    items.sort((itemA, itemB) => {
      // ==========================================
      // ถ้าเลือก Filter สี
      // ให้เสื้อที่มีสีที่เลือกเป็น "สีหลัก" ขึ้นก่อน
      // ==========================================
      if (selectedColors.length > 0) {
        const colorsA = Array.isArray(itemA.colors) ? itemA.colors : [];
        const colorsB = Array.isArray(itemB.colors) ? itemB.colors : [];

        // colors[0] = สีหลัก
        const mainColorA = colorsA[0] || "";
        const mainColorB = colorsB[0] || "";

        const aIsMainColor = selectedColors.includes(mainColorA);
        const bIsMainColor = selectedColors.includes(mainColorB);

        // A เป็นสีหลัก แต่ B ไม่ใช่ → A ขึ้นก่อน
        if (aIsMainColor && !bIsMainColor) {
          return -1;
        }

        // B เป็นสีหลัก แต่ A ไม่ใช่ → B ขึ้นก่อน
        if (!aIsMainColor && bIsMainColor) {
          return 1;
        }
      }

      // ==========================================
      // ถ้า priority สีเท่ากัน
      // ใช้ระบบ Sort เดิม
      // ==========================================
      const dateA = itemA.date || "";
      const dateB = itemB.date || "";
      const nameA = itemA.name || "";
      const nameB = itemB.name || "";

      if (sort?.value === "oldest") {
        return dateA.localeCompare(dateB);
      }

      if (sort?.value === "name") {
        return nameA.localeCompare(nameB, "th");
      }

      // default = ใหม่ล่าสุด
      return dateB.localeCompare(dateA);
    });

    count.textContent = String(items.length);
    empty.hidden = items.length > 0;

    grid.innerHTML = items
      .map(
        (item) => `
      <article class="shirt-item">

        <div class="shirt-thumb">

          <img
            src="${escapeHtml(item.image)}"
            alt="${escapeHtml(item.name)}"
            loading="lazy"
            onerror="this.onerror=null; this.style.display='none';"
          >

          <span class="shirt-category">
            ${categoryNames[item.category] || escapeHtml(item.category)}
          </span>

          ${item.featured ? '<span class="shirt-featured">ແນະນຳ</span>' : ""}

        </div>

        <div class="shirt-meta">

          <h3>${escapeHtml(item.name)}</h3>

          <p class="shirt-code">
            ${escapeHtml(item.code || "ບໍ່ມີລະຫັດແບບ")}
          </p>

          <div class="shirt-details">
            <span>${formatDate(item.date)}</span>
          </div>

          <div class="shirt-color-list">
  ${(item.colors || [])
            .map(
              (color) => `
        <span
          class="shirt-color-dot"
          title="${color}"
          style="background:${colorValues[color] || "#ccc"}"
        ></span>
      `,
            )
            .join("")}
</div>

          <div class="shirt-actions">

    <button
        class="btn btn-primary view-shirt-button"
        type="button"
        data-shirt-id="${item.id}">
        ເບິ່ງລາຍລະອຽດ
    </button>

    ${isAdminGallery
            ? `
        <a
            class="btn btn-outline-dark"
            href="edit.html?publicId=${encodeURIComponent(item.cloudinaryPublicId)}">
            ແກ້ໄຂ
        </a>
        `
            : `
        <a
  class="btn btn-whatsapp card-whatsapp-button"
  href="${createWhatsAppOrderUrl(item)}"
  target="_blank"
  rel="noopener noreferrer"
  data-shirt-id="${escapeHtml(String(item.id))}"
>
  WhatsApp
</a>
        `
          }

</div>

        </div>

      </article>
    `,
      )
      .join("");
  }

  function renderRelatedShirts(currentItem) {
    const relatedShirts =
      document.querySelector("#relatedShirts");

    if (!relatedShirts || !currentItem) {
      return;
    }

    // ID เสื้อที่เราเลือกเองจาก Upload/Edit
    const selectedIds =
      Array.isArray(currentItem.relatedShirtIds)
        ? currentItem.relatedShirtIds.map(String)
        : [];

    // เอา ID ที่เลือก ไปหาเสื้อจริงจาก Gallery
    const items = selectedIds
      .map((id) =>
        cloudinaryItems.find(
          (shirt) =>
            String(shirt.id) === String(id)
        )
      )
      .filter(Boolean);

    // ถ้ายังไม่ได้เลือกเสื้อแนะนำ
    if (items.length === 0) {
      relatedShirts.innerHTML = `
      <p class="related-shirts-empty">
        ຍັງບໍ່ມີແບບເສື້ອແນະນຳ
      </p>
    `;

      return;
    }

    // แสดงเฉพาะเสื้อที่เราเลือกเอง
    relatedShirts.innerHTML = items
      .map(
        (item) => `
        <button
          type="button"
          class="related-shirt-card"
          data-related-shirt-id="${escapeHtml(
          String(item.id)
        )}"
        >
          <div class="related-shirt-image">
            <img
              src="${escapeHtml(item.image)}"
              alt="${escapeHtml(item.name)}"
              loading="lazy"
            >
          </div>

          <div class="related-shirt-content">
            <strong>
              ${escapeHtml(item.name)}
            </strong>

            <span>
              ${escapeHtml(item.code || "")}
            </span>
          </div>
        </button>
      `
      )
      .join("");
  }

  function openShirtModal(item) {
    if (!modal || !item) {
      return;
    }

    activeModalItem = item;

    // ไม่นับการเปิดจากหน้า Admin
    // นับการเปิด Modal
    // ยกเว้นครั้งแรกที่เปิดจากลิงก์ WhatsApp
    if (!isAdminGallery) {

      const isWhatsAppDeepLinkOpen =
        skipDeepLinkModalAnalytics &&
        (
          String(item.cloudinaryPublicId) === String(deepLinkShirt) ||
          String(item.id) === String(deepLinkShirt)
        );

      if (isWhatsAppDeepLinkOpen) {

        // ข้ามการนับเฉพาะครั้งแรก
        skipDeepLinkModalAnalytics = false;

      } else {

        void trackAnalyticsEvent(
          "modal_open",
          item
        );

      }
    }

    const itemName = item.name || "ບໍ່ມີຊື່";

    const itemImage = item.image || "";

    if (modalOpenImage) {
      modalOpenImage.href = itemImage;
    }

    if (modalImage) {
      modalImage.src = itemImage;
      modalImage.alt = itemName;
    }

    if (modalName) {
      modalName.textContent = itemName;
    }

    if (modalCategory) {
      modalCategory.textContent =
        categoryNames[item.category] || item.category || "ບໍ່ລະບຸໝວດໝູ່";
    }

    if (modalCode) {
      modalCode.textContent = item.code || "ບໍ່ມີລະຫັດແບບ";
    }

    if (modalDate) {
      modalDate.textContent = item.date
        ? formatDate(item.date)
        : "ບໍ່ລະບຸວັນທີ່";
    }

    const colors = Array.isArray(item.colors) ? item.colors : [];

    if (modalColor) {
      modalColor.innerHTML =
        colors.length > 0
          ? colors
            .map(
              (color) => `
                <span
                  class="modal-color-dot"
                  title="${escapeHtml(color)}"
                  style="background:${colorValues[color] || "#cccccc"}"
                ></span>
              `,
            )
            .join("")
          : "<span>ບໍ່ລະບຸສີ</span>";
    }

    if (modalTags) {
      modalTags.textContent = item.tags || "ບໍ່ມີແທັກ";
    }

    /* แสดงเสื้อที่คล้ายกัน */
    renderRelatedShirts(item);

    if (modalEditShirt) {
      if (isAdminGallery) {
        modalEditShirt.href = `edit.html?publicId=${encodeURIComponent(
          item.cloudinaryPublicId,
        )}`;

        modalEditShirt.hidden = false;
      } else {
        modalEditShirt.hidden = true;
      }
    }

    if (modalWhatsApp) {
      modalWhatsApp.href = createWhatsAppOrderUrl(item);

      modalWhatsApp.hidden = isAdminGallery;
    }

    modal.hidden = false;

    document.body.classList.add("modal-open");
  }

  relatedShirts?.addEventListener("click", (event) => {
    const card = event.target.closest(
      ".related-shirt-card"
    );

    if (!card) return;

    const shirtId =
      card.dataset.relatedShirtId;

    const selectedItem =
      cloudinaryItems.find(
        (item) =>
          String(item.id) === String(shirtId)
      );

    if (!selectedItem) return;

    openShirtModal(selectedItem);

    const modalContent =
      modal?.querySelector(
        ".shirt-modal-content"
      );

    modalContent?.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });


  function closeShirtModal() {
    if (!modal) {
      return;
    }

    modal.hidden = true;
    document.body.classList.remove("modal-open");

    modalImage.src = "";

    activeModalItem = null;
  }

  grid.addEventListener("click", (event) => {
    const button = event.target.closest(".view-shirt-button");

    if (!button) {
      return;
    }

    const shirtId = button.dataset.shirtId;

    const selectedItem = cloudinaryItems.find(
      (item) => String(item.id) === String(shirtId),
    );

    if (!selectedItem) {
      return;
    }

    openShirtModal(selectedItem);
  });

  grid.addEventListener("click", (event) => {
    const whatsappButton =
      event.target.closest(
        ".card-whatsapp-button"
      );

    if (!whatsappButton) {
      return;
    }

    if (isAdminGallery) {
      return;
    }

    const shirtId =
      whatsappButton.dataset.shirtId;

    const selectedItem =
      cloudinaryItems.find(
        (item) =>
          String(item.id) ===
          String(shirtId)
      );

    if (!selectedItem) {
      return;
    }

    void trackAnalyticsEvent(
      "whatsapp_click",
      selectedItem
    );
  });

  modalOpenImage?.addEventListener("click", () => {
    if (isAdminGallery || !activeModalItem) {
      return;
    }

    void trackAnalyticsEvent("full_image_open", activeModalItem);
  });

  modalWhatsApp?.addEventListener("click", () => {
    if (isAdminGallery || !activeModalItem) {
      return;
    }

    void trackAnalyticsEvent("whatsapp_click", activeModalItem);
  });

  modalCloseButton?.addEventListener("click", closeShirtModal);

  modal?.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-modal]")) {
      closeShirtModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal && !modal.hidden) {
      closeShirtModal();
    }
  });

  // ต้องเรียก render ทุกครั้ง ไม่ว่าจะมี shirt ใน URL หรือไม่
  render();

  // ตรวจสอบลิงก์สำหรับเปิด Modal
  const shirtFromUrl = new URLSearchParams(window.location.search).get("shirt");

  if (shirtFromUrl) {
    const selectedItem = cloudinaryItems.find(
      (item) =>
        String(item.cloudinaryPublicId) === String(shirtFromUrl) ||
        String(item.id) === String(shirtFromUrl),
    );

    if (selectedItem) {
      // รอให้รายการเสื้อแสดงเสร็จก่อน แล้วค่อยเปิด Modal
      requestAnimationFrame(() => {
        openShirtModal(selectedItem);
      });
    }
  }
}

async function resizeImage(file, maxSize = 1600, quality = 0.85) {
  const bitmap = await createImageBitmap(file);

  let width = bitmap.width;
  let height = bitmap.height;

  if (width <= maxSize && height <= maxSize) {
    bitmap.close?.();
    return file;
  }

  const scale = Math.min(maxSize / width, maxSize / height);

  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close?.();
    throw new Error("ບໍ່ສາມາດຫຍໍ້ຮູບພາບໄດ້");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("ไม่สามารถสร้างไฟล์รูปที่ย่อแล้วได้"));
        }
      },
      "image/webp",
      quality,
    );
  });

  const originalName = file.name.replace(/\.[^/.]+$/, "");

  return new File([blob], `${originalName}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 MB";
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function prepareResizedImage(file, maxSize = 1600, quality = 0.85) {
  const bitmap = await createImageBitmap(file);

  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;

  // รูปไม่เกินขนาดที่กำหนด ไม่ต้องปรับ
  if (originalWidth <= maxSize && originalHeight <= maxSize) {
    bitmap.close?.();

    return {
      originalFile: file,
      resizedFile: file,
      needsResize: false,
      originalWidth,
      originalHeight,
      resizedWidth: originalWidth,
      resizedHeight: originalHeight,
      originalBytes: file.size,
      resizedBytes: file.size,
    };
  }

  const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight);

  const resizedWidth = Math.round(originalWidth * scale);
  const resizedHeight = Math.round(originalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = resizedWidth;
  canvas.height = resizedHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close?.();
    throw new Error("ບໍ່ສາມາດປັບຂະໜາດຮູບພາບໄດ້");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.drawImage(bitmap, 0, 0, resizedWidth, resizedHeight);

  bitmap.close?.();

  const resizedBlob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("ບໍ່ສາມາດສ້າງໄຟລທີ່ປັບຂະໜາດແລ້ວໄດ້"));
        }
      },
      "image/webp",
      quality,
    );
  });

  const originalName = file.name.replace(/\.[^/.]+$/, "");

  const resizedFile = new File([resizedBlob], `${originalName}-1600.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });

  return {
    originalFile: file,
    resizedFile,
    needsResize: true,
    originalWidth,
    originalHeight,
    resizedWidth,
    resizedHeight,
    originalBytes: file.size,
    resizedBytes: resizedFile.size,
  };
}

function showResizeConfirmation(result) {
  return new Promise((resolve) => {
    const modal = document.querySelector("#resizeModal");

    const originalDimensions = document.querySelector(
      "#resizeOriginalDimensions",
    );

    const originalFileSize = document.querySelector("#resizeOriginalFileSize");

    const newDimensions = document.querySelector("#resizeNewDimensions");

    const newFileSize = document.querySelector("#resizeNewFileSize");

    const savingPercent = document.querySelector("#resizeSavingPercent");

    const useOriginalButton = document.querySelector("#resizeUseOriginal");

    const useOptimizedButton = document.querySelector("#resizeUseOptimized");

    const backdrop = modal?.querySelector(".resize-confirm-backdrop");

    if (
      !modal ||
      !originalDimensions ||
      !originalFileSize ||
      !newDimensions ||
      !newFileSize ||
      !savingPercent ||
      !useOriginalButton ||
      !useOptimizedButton
    ) {
      console.error("Resize modal HTML ไม่ครบ", {
        modal,
        originalDimensions,
        originalFileSize,
        newDimensions,
        newFileSize,
        savingPercent,
        useOriginalButton,
        useOptimizedButton,
      });

      throw new Error(
        "ບໍ່ເຫັນ Resize Modal ກະລຸນາກວດສອບ HTML ໃນ upload.html ຫຼື edit.html",
      );
    }

    const savedBytes = result.originalBytes - result.resizedBytes;

    const percent =
      result.originalBytes > 0
        ? Math.max(0, Math.round((savedBytes / result.originalBytes) * 100))
        : 0;

    originalDimensions.textContent = `${result.originalWidth} × ${result.originalHeight} px`;

    originalFileSize.textContent = formatFileSize(result.originalBytes);

    newDimensions.textContent = `${result.resizedWidth} × ${result.resizedHeight} px`;

    newFileSize.textContent = formatFileSize(result.resizedBytes);

    savingPercent.textContent = `${percent}%`;

    modal.hidden = false;
    document.body.classList.add("resize-modal-open");

    function closeModal(useOptimized) {
      modal.hidden = true;
      document.body.classList.remove("resize-modal-open");

      useOriginalButton.removeEventListener("click", selectOriginal);

      useOptimizedButton.removeEventListener("click", selectOptimized);

      backdrop?.removeEventListener("click", selectOriginal);

      document.removeEventListener("keydown", handleKeyboard);

      resolve(useOptimized);
    }

    function selectOriginal() {
      closeModal(false);
    }

    function selectOptimized() {
      closeModal(true);
    }

    function handleKeyboard(event) {
      if (event.key === "Escape") {
        closeModal(false);
      }
    }

    useOriginalButton.addEventListener("click", selectOriginal);

    useOptimizedButton.addEventListener("click", selectOptimized);

    backdrop?.addEventListener("click", selectOriginal);

    document.addEventListener("keydown", handleKeyboard);
  });
}

async function chooseUploadImage(file, messageElement) {
  if (messageElement) {
    messageElement.textContent = "ກຳລັງກວດສອບ ແລະ ທົດລອງປັບຂະໜາດຮູບພາບ...";
  }

  const result = await prepareResizedImage(file, 1600, 0.85);

  // ถ้ารูปไม่เกิน 1600px ให้อัปโหลดไฟล์เดิมทันที
  if (!result.needsResize) {
    return result.originalFile;
  }

  const useOptimized = await showResizeConfirmation(result);

  return useOptimized ? result.resizedFile : result.originalFile;
}

/* =====================================================
   UPLOAD TO CLOUDINARY
===================================================== */

async function uploadToCloudinary(file, metadata = {}) {
  const config = window.CLOUDINARY_CONFIG || {};

  if (!config.cloudName || !config.uploadPreset) {
    throw new Error("ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ Cloudinary ໃນ cloudinary-config.js");
  }

  if (
    config.cloudName.includes("ໃສ່-") ||
    config.uploadPreset.includes("ໃສ່-")
  ) {
    throw new Error("ກະລຸນາໃສ່ Cloud Name ແລະ Upload Preset ຂອງຈິງ");
  }

  const endpoint =
    `https://api.cloudinary.com/v1_1/` +
    `${encodeURIComponent(config.cloudName)}/image/upload`;

  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", config.uploadPreset);

  if (config.folder) {
    formData.append("folder", config.folder);
  }

  const cloudinaryTags = [CLOUDINARY_LIST_TAG];

  if (metadata.tags) {
    const additionalTags = metadata.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    cloudinaryTags.push(...additionalTags);
  }

  formData.append("tags", [...new Set(cloudinaryTags)].join(","));

  /*
    เก็บข้อมูลพื้นฐานเป็น context ใน Cloudinary
    จะช่วยให้ Cloudinary list ส่งข้อมูลกลับมาได้
  */
  const contextValues = [];

  if (metadata.name) {
    contextValues.push(`name=${String(metadata.name).replace(/[|=]/g, " ")}`);
  }

  if (metadata.category) {
    contextValues.push(
      `category=${String(metadata.category).replace(/[|=]/g, " ")}`,
    );
  }

  if (metadata.code) {
    contextValues.push(`code=${String(metadata.code).replace(/[|=]/g, " ")}`);
  }

  if (metadata.color) {
    contextValues.push(`color=${String(metadata.color).replace(/[|=]/g, " ")}`);
  }

  if (metadata.description) {
    contextValues.push(
      `description=${String(metadata.description).replace(/[|=]/g, " ")}`,
    );
  }

  if (contextValues.length > 0) {
    formData.append("context", contextValues.join("|"));
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || "ອັບໂຫລດໄປ Cloudinary ບໍ່ສຳເລັດ");
  }

  return result;
}

async function initRelatedShirtPicker(initialIds = [], currentShirtId = null) {
  const container = document.querySelector("#relatedShirtPicker");
  const searchInput = document.querySelector("#relatedShirtSearch");
  const countElement = document.querySelector("#relatedSelectedCount");

  if (!container) return;

  let shirts = [];

  try {
    shirts = await getGalleryShirtsFromSupabase();
  } catch (error) {
    console.error("ໂຫລດລາຍການເສື້ອແນະນຳບໍ່ສຳເລັດ:", error);

    container.innerHTML = `
      <p>ບໍ່ສາມາດໂຫຼດແບບເສື້ອໄດ້</p>
    `;

    return;
  }

  const selectedIds = new Set(
    initialIds.map(String)
  );

  function updateCount() {
    if (countElement) {
      countElement.textContent = String(selectedIds.size);
    }
  }

  function renderPicker() {
    const query =
      searchInput?.value.trim().toLowerCase() || "";

    const filtered = shirts.filter((shirt) => {
      // หน้า Edit ไม่ให้เลือกตัวเอง
      if (
        currentShirtId !== null &&
        String(shirt.id) === String(currentShirtId)
      ) {
        return false;
      }

      const searchable = [
        shirt.name,
        shirt.code
      ]
        .join(" ")
        .toLowerCase();

      return !query || searchable.includes(query);
    });

    container.innerHTML = filtered
      .map((shirt) => {
        const id = String(shirt.id);
        const selected = selectedIds.has(id);

        return `
          <button
            type="button"
            class="related-picker-card ${selected ? "selected" : ""
          }"
            data-related-id="${escapeHtml(id)}"
          >
            <div class="related-picker-image">
              <img
                src="${escapeHtml(shirt.image)}"
                alt="${escapeHtml(shirt.name)}"
                loading="lazy"
              >

              <span class="related-picker-check">
                ✓
              </span>
            </div>

            <strong>
              ${escapeHtml(shirt.name)}
            </strong>

            <small>
              ${escapeHtml(
            shirt.code || "ບໍ່ມີລະຫັດ"
          )}
            </small>
          </button>
        `;
      })
      .join("");

    updateCount();
  }

  container.addEventListener("click", (event) => {
    const card = event.target.closest(
      ".related-picker-card"
    );

    if (!card) return;

    const id = String(card.dataset.relatedId);

    if (selectedIds.has(id)) {
      selectedIds.delete(id);
    } else {
      selectedIds.add(id);
    }

    renderPicker();
  });

  searchInput?.addEventListener("input", renderPicker);

  window.getSelectedRelatedShirtIds = function () {
    return Array.from(selectedIds);
  };

  renderPicker();
}

/* =====================================================
   UPLOAD PAGE
===================================================== */

function initUpload() {
  const form = document.querySelector("#uploadForm");

  if (!form) {
    return;
  }

  const fileInput = document.querySelector("#shirtImage");
  const preview = document.querySelector("#previewImage");
  const dropzoneText = document.querySelector("#dropzoneText");
  const dropzone = document.querySelector("#dropzone");
  const dateInput = document.querySelector("#uploadDate");
  const message = document.querySelector("#formMessage");
  const submitButton = form.querySelector('button[type="submit"]');

  if (dateInput) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  let previewObjectUrl = null;

  function previewFile(selectedFile) {
    if (!selectedFile) {
      return;
    }

    message.textContent = "";

    if (!selectedFile.type.startsWith("image/")) {
      message.textContent = "ກະລຸນາເລືອກໄຟລ໌ຮູບເທົ່ານັ້ນ";

      fileInput.value = "";
      return;
    }

    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }

    previewObjectUrl = URL.createObjectURL(selectedFile);

    preview.onload = () => {
      preview.hidden = false;
      dropzoneText.hidden = true;
      dropzone.classList.add("has-preview");
    };

    preview.onerror = () => {
      message.textContent = "ไม่สามารถแสดงตัวอย่างรูปภาพนี้ได้";
      preview.hidden = true;
      dropzoneText.hidden = false;
    };

    preview.src = previewObjectUrl;
  }

  fileInput.addEventListener("change", () => {
    previewFile(fileInput.files[0]);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove("dragover");
    });
  });

  dropzone.addEventListener("drop", (event) => {
    const selectedFile = event.dataTransfer.files[0];

    if (!selectedFile) {
      return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(selectedFile);
    fileInput.files = dataTransfer.files;

    previewFile(selectedFile);
  });

  form.addEventListener("reset", () => {
    setTimeout(() => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
      }

      preview.hidden = true;
      preview.removeAttribute("src");
      dropzoneText.hidden = false;
      message.textContent = "";

      if (dateInput) {
        dateInput.value = new Date().toISOString().slice(0, 10);
      }
    }, 0);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const selectedFile = fileInput.files[0];

    if (!selectedFile) {
      message.textContent = "ກະລຸນາເລືອກຮູບເສື້ອ";

      return;
    }

    const name = document.querySelector("#shirtName").value.trim();

    const category = document.querySelector("#shirtCategory").value;

    const code = document.querySelector("#designCode").value.trim();

    const color = document.querySelector("#mainColor").value.trim();

    const tags = document.querySelector("#shirtTags").value.trim();

    const description = document
      .querySelector("#shirtDescription")
      .value.trim();

    const featured = document.querySelector("#featured").checked;

    // ==========================================
    // ตรวจรหัสซ้ำ:
    // ปี + ID + แขน + คอ + ไหล่
    // ถ้าเหมือนกันทั้งหมด = ห้ามซ้ำ
    // ==========================================

    const currentYear = new Date(dateInput.value).getFullYear();

    const currentCollar =
      document.querySelector("#shirtCollar")?.value || "round";

    const currentSleeve =
      document.querySelector("#shirtSleeve")?.value || "short";

    const currentShoulder =
      document.querySelector("#shirtShoulder")?.value || "normal";

    const { data: duplicateItems, error: duplicateError } =
      await window.supabaseClient
        .from("shirts")
        .select(
          "id, upload_date, design_code, collar, sleeve, shoulder"
        )
        .eq("design_code", code);

    if (duplicateError) {
      throw duplicateError;
    }

    const duplicateCode = (duplicateItems || []).some((item) => {

      const itemYear = item.upload_date
        ? new Date(item.upload_date).getFullYear()
        : 0;

      const sameYear = itemYear === currentYear;

      const sameCollar =
        (item.collar || "round") === currentCollar;

      const sameSleeve =
        (item.sleeve || "short") === currentSleeve;

      const sameShoulder =
        (item.shoulder || "normal") === currentShoulder;

      return (
        sameYear &&
        sameCollar &&
        sameSleeve &&
        sameShoulder
      );
    });

    if (code && duplicateCode) {
      message.textContent =
        `ລະຫັດ ${code} ມີແບບແຂນ + ຄໍ + ໄຫຼ່ ນີ້ແລ້ວ`;

      document.querySelector("#designCode").focus();

      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "ກຳລັງອັບໂຫລດ...";

    message.textContent =
      "ກຳລັງສົ່ງຮູບພາບຂຶ້ນ Cloudinary " + "ກະລຸນາຢ່າປິດໜ້ານີ້";

    try {
      const uploadFile = await chooseUploadImage(selectedFile, message);

      message.textContent =
        uploadFile === selectedFile
          ? "ກຳລັງອັບໂຫລດຮູບພາບຕົ້ນສະບັບຂື້ນ Cloudinary..."
          : "ກຳລັງອັບໂຫລດຮູບພາບທີ່ປັບຂະໜາດແລ້ວຂື້ນ Cloudinary...";

      const cloudinaryResult = await uploadToCloudinary(uploadFile, {
        name,
        category,
        code,
        color,
        tags,
        description,
      });

      const collar = document.querySelector("#shirtCollar").value;

      const sleeve = document.querySelector("#shirtSleeve").value;

      const shoulder = document.querySelector("#shirtShoulder").value;

      const orderedColors =
        typeof window.getOrderedShirtColors === "function"
          ? window.getOrderedShirtColors()
          : [];

      const checkedColors = getSelectedShirtColors();

      const colors = orderedColors.length > 0 ? orderedColors : checkedColors;

      const price = calculateShirtPrice(collar, sleeve);

      const relatedShirtIds =
        typeof window.getSelectedRelatedShirtIds === "function"
          ? window.getSelectedRelatedShirtIds()
          : [];

      const item = {
        id: String(Date.now()),
        name,
        category,
        date: dateInput.value,
        code,
        color,
        tags,
        description,
        featured,

        collar,
        sleeve,
        shoulder,
        colors,
        price,

        relatedShirtIds,

        image: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        bytes: cloudinaryResult.bytes,
        format: cloudinaryResult.format,
      };

      await saveShirtToSupabase(item);

      message.textContent = "ອັບໂຫລດສຳເລັດ " + "ກຳລັງເປີດໜ້າແບບເສື້ອ...";

      setTimeout(() => {
        window.location.href = "admin-gallery.html";
      }, 700);
    } catch (error) {
      console.error(error);

      message.textContent = error.message || "ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "ບັນທຶກແບບເສື້ອ";
    }
  });
  initRelatedShirtPicker();
  initColorSorting();
}

async function deleteCloudinaryImage(publicId, deletePassword) {
  const config = window.CLOUDINARY_CONFIG || {};

  if (!config.deleteApiUrl) {
    throw new Error("ບໍ່ພົບ deleteApiUrl");
  }

  if (!publicId) {
    throw new Error("ບໍ່ພົບ Cloudinary Public ID");
  }

  const response = await fetch(config.deleteApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      publicId,
      deletePassword,
    }),
  });

  const result = await response.json();

  if (!response.ok || result.success !== true) {
    throw new Error(result.message || "ລົບຮູບຈາກ Cloudinary ບໍ່ສຳເລັດ");
  }

  return result;
}

/* =====================================================
   EDIT PAGE
===================================================== */

async function initEdit() {
  const form = document.querySelector("#editForm");

  if (!form) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const publicId = params.get("publicId");

  const message = document.querySelector("#formMessage");
  const fileInput = document.querySelector("#shirtImage");
  const preview = document.querySelector("#previewImage");
  const dropzoneText = document.querySelector("#dropzoneText");
  const deleteButton = document.querySelector("#deleteShirt");
  const submitButton = form.querySelector('button[type="submit"]');

  let currentItem;

  if (!publicId) {
    message.textContent = "ບໍ່ພົບ Cloudinary Public ID";
    return;
  }
  try {
    const { data, error } = await window.supabaseClient
      .from("shirts")
      .select("*")
      .eq("cloudinary_public_id", publicId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      message.textContent = "ບໍ່ພົບລາຍການໃນ Supabase";

      console.warn("ไม่พบ cloudinary_public_id:", publicId);

      return;
    }

    currentItem = {
      id: data.id,
      name: data.name || "",
      category: data.category || "football",

      date: data.upload_date || "",
      code: data.design_code || "",
      color: data.main_color || "",

      tags: data.tags || "",
      description: data.description || "",
      featured: data.featured === true,

      collar: data.collar || "round",
      sleeve: data.sleeve || "short",
      shoulder: data.shoulder || "normal",

      colors: Array.isArray(data.colors) ? data.colors : [],

      price: Number(data.price || 0),

      relatedShirtIds: Array.isArray(data.related_shirt_ids)
        ? data.related_shirt_ids.map(String)
        : [],

      image: data.image || "",
      cloudinaryPublicId: data.cloudinary_public_id || "",

      width: data.width,
      height: data.height,
      bytes: data.bytes,
      format: data.format,
    };
  } catch (error) {
    console.error("ໂຫລດໜ້າຂໍ້ມູນ Edit ບໍ່ສຳເລັດ:", error);

    message.textContent = "ດຶງຂໍ້ມູນຈາກ Supabase ບໍ່ສຳເລັດ";

    return;
  }

  await initRelatedShirtPicker(
    currentItem.relatedShirtIds || [],
    currentItem.id
  );

  let previewObjectUrl = null;

  // นำข้อมูลเดิมใส่ในฟอร์ม
  document.querySelector("#shirtName").value = currentItem.name || "";

  document.querySelector("#shirtCategory").value =
    currentItem.category || "football";

  document.querySelector("#uploadDate").value = currentItem.date || "";

  document.querySelector("#designCode").value = currentItem.code || "";

  document.querySelector("#mainColor").value = currentItem.color || "";

  document.querySelector("#shirtTags").value = currentItem.tags || "";

  document.querySelector("#shirtDescription").value =
    currentItem.description || "";

  document.querySelector("#featured").checked = currentItem.featured === true;

  const collarSelect = document.querySelector("#shirtCollar");
  const sleeveSelect = document.querySelector("#shirtSleeve");
  const shoulderSelect = document.querySelector("#shirtShoulder");
  const priceInput = document.querySelector("#shirtPrice");
  const priceText = document.querySelector("#calculatedPrice");

  if (collarSelect) {
    collarSelect.value = currentItem.collar || "round";
  }

  if (sleeveSelect) {
    sleeveSelect.value = currentItem.sleeve || "short";
  }

  if (shoulderSelect) {
    shoulderSelect.value = currentItem.shoulder || "normal";
  }

  const savedColors = Array.isArray(currentItem.colors)
    ? currentItem.colors
    : [];

  document.querySelectorAll('input[name="shirtColors"]').forEach((input) => {
    input.checked = savedColors.includes(input.value);
  });

  initColorSorting(savedColors);

  const currentPrice = calculateShirtPrice(
    collarSelect?.value || "round",
    sleeveSelect?.value || "short",
  );

  if (priceInput) {
    priceInput.value = String(currentPrice);
  }

  if (priceText) {
    priceText.textContent = formatPrice(currentPrice);
  }

  if (currentItem.image) {
    preview.src = currentItem.image;
    preview.hidden = false;
    dropzoneText.hidden = true;
  }

  fileInput.addEventListener("change", () => {
    const selectedFile = fileInput.files[0];

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      message.textContent = "ກະລຸນາເລືອກໄຟລຮູບເທົ່ານັ້ນ";
      fileInput.value = "";
      return;
    }

    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }

    previewObjectUrl = URL.createObjectURL(selectedFile);
    preview.src = previewObjectUrl;
    preview.hidden = false;
    dropzoneText.hidden = true;
  });

  // บันทึกการแก้ไข
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const newCode =
      document.querySelector("#designCode").value.trim();

    const editYear = new Date(
      document.querySelector("#uploadDate").value
    ).getFullYear();

    const currentCollar =
      document.querySelector("#shirtCollar")?.value || "round";

    const currentSleeve =
      document.querySelector("#shirtSleeve")?.value || "short";

    const currentShoulder =
      document.querySelector("#shirtShoulder")?.value || "normal";

    const { data: duplicateItems, error: duplicateError } =
      await window.supabaseClient
        .from("shirts")
        .select(
          "id, upload_date, design_code, collar, sleeve, shoulder"
        )
        .eq("design_code", newCode)
        .neq("id", currentItem.id);

    if (duplicateError) {
      throw duplicateError;
    }

    const duplicateCode = (duplicateItems || []).some((item) => {

      const itemYear = item.upload_date
        ? new Date(item.upload_date).getFullYear()
        : 0;

      const sameYear = itemYear === editYear;

      const sameCollar =
        (item.collar || "round") === currentCollar;

      const sameSleeve =
        (item.sleeve || "short") === currentSleeve;

      const sameShoulder =
        (item.shoulder || "normal") === currentShoulder;

      return (
        sameYear &&
        sameCollar &&
        sameSleeve &&
        sameShoulder
      );
    });

    if (newCode && duplicateCode) {

      message.textContent =
        `ລະຫັດ ${newCode} ມີແບບແຂນ + ຄໍ + ໄຫຼ່ ນີ້ແລ້ວ`;

      document.querySelector("#designCode").focus();

      return;
    }
    
    submitButton.disabled = true;
    submitButton.textContent = "ກຳລັງບັນທຶກ...";
    message.textContent = "ກຳລັງບັນທຶກຂໍ້ມູນ";

    try {
      let imageData = {
        image: currentItem.image,
        cloudinaryPublicId: currentItem.cloudinaryPublicId,
        width: currentItem.width,
        height: currentItem.height,
        bytes: currentItem.bytes,
        format: currentItem.format,
      };

      const selectedFile = fileInput.files[0];

      // ถ้าเลือกรูปใหม่ ให้อัปโหลดรูปใหม่ขึ้น Cloudinary
      if (selectedFile) {
        const uploadFile = await chooseUploadImage(selectedFile, message);

        message.textContent =
          uploadFile === selectedFile
            ? "ກຳລັງອັບໂຫລດຮູບພາບຕົ້ນສະບັບຂື້ນ Cloudinary..."
            : "ກຳລັງອັບໂຫລດຮູບພາບທີ່ປັບຂະໜາດແລ້ວຂື້ນ Cloudinary...";

        const cloudinaryResult = await uploadToCloudinary(uploadFile, {
          name: document.querySelector("#shirtName").value.trim(),
          category: document.querySelector("#shirtCategory").value,
          code: document.querySelector("#designCode").value.trim(),
          color: document.querySelector("#mainColor").value.trim(),
          tags: document.querySelector("#shirtTags").value.trim(),
          description: document.querySelector("#shirtDescription").value.trim(),
        });

        imageData = {
          image: cloudinaryResult.secure_url,
          cloudinaryPublicId: cloudinaryResult.public_id,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          bytes: cloudinaryResult.bytes,
          format: cloudinaryResult.format,
        };
      }

      const collar = document.querySelector("#shirtCollar")?.value || "round";

      const sleeve = document.querySelector("#shirtSleeve")?.value || "short";

      const shoulder =
        document.querySelector("#shirtShoulder")?.value || "normal";

      const orderedColors =
        typeof window.getOrderedShirtColors === "function"
          ? window.getOrderedShirtColors()
          : [];

      const checkedColors = getSelectedShirtColors();

      const colors = orderedColors.length > 0 ? orderedColors : checkedColors;

      console.log("orderedColors:", orderedColors);
      console.log("checkedColors:", checkedColors);
      console.log("colors ที่ส่งเข้า Supabase:", colors);

      const price = calculateShirtPrice(collar, sleeve);

      const relatedShirtIds =
        typeof window.getSelectedRelatedShirtIds === "function"
          ? window.getSelectedRelatedShirtIds()
          : currentItem.relatedShirtIds || [];

      const updatedItem = {
        name: document.querySelector("#shirtName").value.trim(),
        category: document.querySelector("#shirtCategory").value,
        upload_date: document.querySelector("#uploadDate").value,
        design_code: document.querySelector("#designCode").value.trim(),
        main_color: document.querySelector("#mainColor").value.trim(),
        tags: document.querySelector("#shirtTags").value.trim(),
        description: document.querySelector("#shirtDescription").value.trim(),
        featured: document.querySelector("#featured").checked,
        collar,
        sleeve,
        shoulder,
        colors,
        price,
        related_shirt_ids: relatedShirtIds,
        image: imageData.image,
        cloudinary_public_id: imageData.cloudinaryPublicId,
        width: imageData.width,
        height: imageData.height,
        bytes: imageData.bytes,
        format: imageData.format,
      };

      const { error } = await window.supabaseClient
        .from("shirts")
        .update(updatedItem)
        .eq("id", currentItem.id);

      if (error) throw error;

      message.textContent = "ບັນທຶກການແກ້ໄຂສຳເລັດ";

      setTimeout(() => {
        window.location.href = "admin-gallery.html";
      }, 700);
    } catch (error) {
      console.error(error);
      message.textContent = error.message || "ບັນທຶກການແກ້ໄຂບໍ่ສຳເລັດ";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "ບັນທຶກການແກ້ໄຂ";
    }
  });

  // ลบรายการและลบรูปจาก Cloudinary
  deleteButton.addEventListener("click", async () => {
    const confirmed = window.confirm(
      "ຕ້ອງການລົບຮູບນີ້ອອກຈາກ Cloudinary ແທ້ບໍ?",
    );

    if (!confirmed) {
      return;
    }

    const deletePassword = window.prompt("ກະລຸນາໃສ່ລະຫັດລົບ");

    if (deletePassword === null) {
      return;
    }

    if (!deletePassword.trim()) {
      window.alert("ກະລຸນາໃສ່ລະຫັດລົບ");
      return;
    }

    const oldButtonText = deleteButton.textContent;

    deleteButton.disabled = true;
    deleteButton.textContent = "ກຳລັງລົບ...";
    message.textContent = "ກຳລັງລົບຮູບຈາກ Cloudinary...";

    try {
      await deleteCloudinaryImage(
        currentItem.cloudinaryPublicId,
        deletePassword,
      );

      rememberDeletedImage(currentItem.cloudinaryPublicId);

      const { error } = await window.supabaseClient
        .from("shirts")
        .delete()
        .eq("id", currentItem.id);

      if (error) throw error;

      message.textContent = "ລົບຮູບ ແລະ ຂໍ້ມູນສຳເລັດ";

      setTimeout(() => {
        window.location.href = `admin-gallery.html?deleted=${Date.now()}`;
      }, 700);
    } catch (error) {
      console.error(error);

      message.textContent = error.message || "ລົບຮູບບໍ່ສຳເລັດ";

      deleteButton.disabled = false;
      deleteButton.textContent = oldButtonText;
    }
  });
}

function initFilterToggle() {
  const toggleBtn = document.querySelector("#toggleFilter");
  const sidebar = document.querySelector("#filterSidebar");

  if (!toggleBtn || !sidebar) return;

  // เริ่มต้นให้ Filter ปิด
  if (window.innerWidth > 992) {
    sidebar.classList.add("is-hidden");
  } else {
    sidebar.classList.remove("show");
  }

  function updateButtonText() {
    const isMobile = window.innerWidth <= 992;

    if (isMobile) {
      toggleBtn.textContent = sidebar.classList.contains("show")
        ? "✕ ປິດຕົວກອງ"
        : "☰ ເປີດຕົວກອງ";
    } else {
      toggleBtn.textContent = sidebar.classList.contains("is-hidden")
        ? "☰ ເປີດຕົວກອງ"
        : "✕ ປິດຕົວກອງ";
    }
  }

  toggleBtn.addEventListener("click", () => {
    if (window.innerWidth <= 992) {
      sidebar.classList.toggle("show");
    } else {
      sidebar.classList.toggle("is-hidden");
    }

    updateButtonText();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 992) {
      sidebar.classList.remove("show");
    } else {
      sidebar.classList.remove("is-hidden");
    }

    updateButtonText();
  });

  updateButtonText();
}

/* =====================================================
   START
===================================================== */
async function startApp() {
  try {
    let attempts = 0;

    while (!window.supabaseClient && attempts < 100) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.supabaseClient) {
      throw new Error("Supabase เชื่อมต่อไม่สำเร็จ");
    }

    const gallery = document.querySelector("#shirtGallery");
    const uploadForm = document.querySelector("#uploadForm");
    const editForm = document.querySelector("#editForm");

    if (gallery) {
      console.log("เริ่มโหลด Gallery");
      await initGallery();
    }

    if (uploadForm) {
      console.log("เริ่มหน้า Upload");
      initUpload();
      initPriceCalculator();
    }

    if (editForm) {
      console.log("เริ่มหน้า Edit");
      await initEdit();
      initPriceCalculator();
    }

    initFilterToggle();
  } catch (error) {
    console.error("startApp error:", error);

    const grid = document.querySelector("#shirtGallery");
    const message = document.querySelector("#formMessage");

    if (grid) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>โหลดข้อมูลไม่สำเร็จ</h3>
          <p>${escapeHtml(error.message || "เกิดข้อผิดพลาด")}</p>
        </div>
      `;
    }

    if (message) {
      message.textContent = error.message || "เกิดข้อผิดพลาดในการเริ่มระบบ";
    }
  }
}
startApp();
