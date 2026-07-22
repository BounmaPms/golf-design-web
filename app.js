const STORAGE_KEY = "golfDesignShirts";
const CLOUDINARY_LIST_TAG = "golf-design-shirts";

const categoryNames = {
  football: "ເສື້ອກິລາ",
  team: "ເສື້ອທີມງານ",
  company: "ເສື້ອບໍລິສັດ",
  meme: "ເສື້ອມີມ"
};

const statusNames = {
  available: "ພ້ອມຜະລິດ",
  draft: "ແບບຮ່າງ",
  soldout: "ປິດຮັບ"
};

/* =====================================================
   LOCAL STORAGE
===================================================== */

function getShirts() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("ອ່ານຂໍ້ມູນ LocalStorage ບໍ່ສຳເລັດ:", error);
    return [];
  }
}

function saveShirts(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/* =====================================================
   HELPERS
===================================================== */

function formatDate(dateString) {
    if (!dateString) return "-";

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(new Date(dateString));
}

function escapeHtml(text = "") {
  return String(text).replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);
}

function getFileNameFromPublicId(publicId = "") {
  const fileName = publicId.split("/").pop() || "Cloudinary image";

  return fileName
    .replace(/[-_]+/g, " ")
    .trim();
}

function buildCloudinaryImageUrl(cloudName, resource) {
  if (resource.secure_url) {
    return resource.secure_url;
  }

  const version = resource.version
    ? `v${resource.version}/`
    : "";

  const format = resource.format
    ? `.${resource.format}`
    : "";

  const publicId = String(resource.public_id || "")
    .split("/")
    .map(part => encodeURIComponent(part))
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
    throw new Error(
      "ບໍ່ພົບ Cloud Name ໃນໄຟລ໌ cloudinary-config.js"
    );
  }

  const listUrl =
    `https://res.cloudinary.com/${encodeURIComponent(config.cloudName)}` +
    `/image/list/${encodeURIComponent(CLOUDINARY_LIST_TAG)}.json`;

  const response = await fetch(listUrl, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        `ບໍ່ພົບລາຍການຮູບ Cloudinary ທີ່ມີ Tag "${CLOUDINARY_LIST_TAG}". ` +
        "ກວດສອບວ່າເປີດ Client-side asset lists ແລ້ວ ແລະ ຮູບມີ Tag ນີ້"
      );
    }

    throw new Error(
      `ດຶງຮູບຈາກ Cloudinary ບໍ່ສຳເລັດ (${response.status})`
    );
  }

  const result = await response.json();
  const resources = Array.isArray(result.resources)
    ? result.resources
    : [];

  const localItems = getShirts();

  return resources.map((resource, index) => {
    const localItem = localItems.find(item =>
      item.cloudinaryPublicId === resource.public_id ||
      item.image === resource.secure_url
    );

    const createdDate = resource.created_at
      ? resource.created_at.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    return {
      id:
        localItem?.id ||
        resource.public_id ||
        `cloudinary-${index}`,

      name:
        localItem?.name ||
        resource.context?.custom?.name ||
        getFileNameFromPublicId(resource.public_id),

      category:
        localItem?.category ||
        resource.context?.custom?.category ||
        "football",

      date:
        localItem?.date ||
        createdDate,

      code:
        localItem?.code ||
        resource.context?.custom?.code ||
        resource.public_id ||
        "",

      color:
        localItem?.color ||
        resource.context?.custom?.color ||
        "",

      status:
        localItem?.status ||
        resource.context?.custom?.status ||
        "available",

      tags:
        localItem?.tags ||
        (
          Array.isArray(resource.tags)
            ? resource.tags.join(" ")
            : ""
        ),

      description:
        localItem?.description ||
        resource.context?.custom?.description ||
        "",

      featured:
        localItem?.featured === true,

      image: buildCloudinaryImageUrl(
        config.cloudName,
        resource
      ),

      cloudinaryPublicId: resource.public_id,
      width: resource.width,
      height: resource.height,
      bytes: resource.bytes,
      format: resource.format
    };
  });
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
  const modalStatus = document.querySelector("#modalShirtStatus");
  const modalTags = document.querySelector("#modalShirtTags");
  const modalDescription = document.querySelector("#modalShirtDescription");
  const modalOpenImage = document.querySelector("#modalOpenImage");
  const modalEditShirt = document.querySelector("#modalEditShirt");

  let activeCategory = "all";
  let cloudinaryItems = [];

  grid.innerHTML = `
    <div class="empty-state">
      <h3>ກຳລັງໂຫລດຮູບ...</h3>
      <p>ກຳລັງດຶງຮູບພາບຈາກ Cloudinary</p>
    </div>
  `;

  try {
    cloudinaryItems = await getCloudinaryShirts();
  } catch (error) {
    console.error(error);

    grid.innerHTML = `
      <div class="empty-state">
        <h3>ດຶງຮູບຈາກ Cloudinary ບໍ່ສຳເລັດ</h3>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;

    count.textContent = "0";
    return;
  }

  document
    .querySelectorAll("#categoryFilters button")
    .forEach(button => {
      button.addEventListener("click", () => {
        document
          .querySelectorAll("#categoryFilters button")
          .forEach(item => item.classList.remove("active"));

        button.classList.add("active");
        activeCategory = button.dataset.category;
        render();
      });
    });

  search?.addEventListener("input", render);
  sort?.addEventListener("change", render);

  function render() {
    const query = search?.value
      .trim()
      .toLowerCase() || "";

    let items = cloudinaryItems.filter(item => {
      const categoryMatches =
        activeCategory === "all" ||
        item.category === activeCategory;

      const searchableText = [
        item.name,
        item.code,
        item.tags,
        item.description,
        item.color,
        item.cloudinaryPublicId
      ]
        .join(" ")
        .toLowerCase();

      const searchMatches =
        !query ||
        searchableText.includes(query);

      return categoryMatches && searchMatches;
    });

    items.sort((itemA, itemB) => {
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

      return dateB.localeCompare(dateA);
    });

    count.textContent = String(items.length);
    empty.hidden = items.length > 0;

    grid.innerHTML = items.map(item => `
      <article class="shirt-item">

        <div class="shirt-thumb">

          <img
            src="${escapeHtml(item.image)}"
            alt="${escapeHtml(item.name)}"
            loading="lazy"
            onerror="this.onerror=null; this.src='img/image-not-found.png';"
          >

          <span class="shirt-category">
            ${categoryNames[item.category] ||
      escapeHtml(item.category)
      }
          </span>

          ${item.featured
        ? '<span class="shirt-featured">ແນະນຳ</span>'
        : ""
      }

        </div>

        <div class="shirt-meta">

          <h3>${escapeHtml(item.name)}</h3>

          <p class="shirt-code">
            ${escapeHtml(
        item.code ||
        "ບໍ່ມີລະຫັດແບບ"
      )
      }
          </p>

          <p class="shirt-description">
            ${escapeHtml(
        item.description ||
        "ບໍ່ມີລາຍລະອຽດ"
      )
      }
          </p>

          <div class="shirt-details">
            <span>${formatDate(item.date)}</span>
            <span>
              ${escapeHtml(
        item.color ||
        "ບໍ່ລະບຸສີ"
      )
      }
            </span>
          </div>

          <span class="status-pill ${escapeHtml(item.status)}">
            ${statusNames[item.status] ||
      escapeHtml(item.status)
      }
          </span>

          <div class="shirt-actions">
            <button class="btn btn-primary view-shirt-button" type="button" data-shirt-id="${escapeHtml(String(item.id))}"
  >
    ເບິ່ງຮູບເຕັມ
  </button>

  <a
    class="btn btn-outline-dark"
    href="edit.html?id=${encodeURIComponent(item.id)}"
  >
    ແກ້ໄຂ
  </a>
</div>

        </div>

      </article>
    `).join("");
  }
  function openShirtModal(item) {
    if (!modal || !item) {
      return;
    }

    const itemName = item.name || "ບໍ່ມີຊື່";
    const itemImage = item.image || "";

    modalImage.src = itemImage;
    modalImage.alt = itemName;

    modalName.textContent = itemName;

    modalCategory.textContent =
      categoryNames[item.category] ||
      item.category ||
      "ບໍ່ລະບຸໝວດໝູ່";

    modalCode.textContent =
      item.code || "ບໍ່ມີລະຫັດແບບ";

    modalDate.textContent =
      item.date
        ? formatDate(item.date)
        : "ບໍ່ລະບຸວັນທີ່";

    modalColor.textContent =
      item.color || "ບໍ່ລະບຸສີ";

    modalStatus.textContent =
      statusNames[item.status] ||
      item.status ||
      "ບໍ່ລະບຸສະຖານະ";

    modalTags.textContent =
      item.tags || "ບໍ່ມີແທັກ";

    modalDescription.textContent =
      item.description || "ບໍ່ມີລາຍລະອຽດ";

    modalOpenImage.href = itemImage;

    modalEditShirt.href =
      `edit.html?id=${encodeURIComponent(item.id)}`;

    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeShirtModal() {
    if (!modal) {
      return;
    }

    modal.hidden = true;
    document.body.classList.remove("modal-open");

    modalImage.src = "";
  }

  grid.addEventListener("click", event => {
    const button = event.target.closest(".view-shirt-button");

    if (!button) {
      return;
    }

    const shirtId = button.dataset.shirtId;

    const selectedItem = cloudinaryItems.find(item =>
      String(item.id) === String(shirtId)
    );

    if (!selectedItem) {
      return;
    }

    openShirtModal(selectedItem);
  });

  modalCloseButton?.addEventListener("click", closeShirtModal);

  modal?.addEventListener("click", event => {
    if (event.target.matches("[data-close-modal]")) {
      closeShirtModal();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && modal && !modal.hidden) {
      closeShirtModal();
    }
  });

  render();
}

/* =====================================================
   UPLOAD TO CLOUDINARY
===================================================== */

async function uploadToCloudinary(file, metadata = {}) {
  const config = window.CLOUDINARY_CONFIG || {};

  if (!config.cloudName || !config.uploadPreset) {
    throw new Error(
      "ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ Cloudinary ໃນ cloudinary-config.js"
    );
  }

  if (
    config.cloudName.includes("ໃສ່-") ||
    config.uploadPreset.includes("ໃສ່-")
  ) {
    throw new Error(
      "ກະລຸນາໃສ່ Cloud Name ແລະ Upload Preset ຂອງຈິງ"
    );
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
      .map(tag => tag.trim())
      .filter(Boolean);

    cloudinaryTags.push(...additionalTags);
  }

  formData.append(
    "tags",
    [...new Set(cloudinaryTags)].join(",")
  );

  /*
    เก็บข้อมูลพื้นฐานเป็น context ใน Cloudinary
    จะช่วยให้ Cloudinary list ส่งข้อมูลกลับมาได้
  */
  const contextValues = [];

  if (metadata.name) {
    contextValues.push(
      `name=${String(metadata.name).replace(/[|=]/g, " ")}`
    );
  }

  if (metadata.category) {
    contextValues.push(
      `category=${String(metadata.category).replace(/[|=]/g, " ")}`
    );
  }

  if (metadata.code) {
    contextValues.push(
      `code=${String(metadata.code).replace(/[|=]/g, " ")}`
    );
  }

  if (metadata.color) {
    contextValues.push(
      `color=${String(metadata.color).replace(/[|=]/g, " ")}`
    );
  }

  if (metadata.status) {
    contextValues.push(
      `status=${String(metadata.status).replace(/[|=]/g, " ")}`
    );
  }

  if (metadata.description) {
    contextValues.push(
      `description=${String(metadata.description).replace(/[|=]/g, " ")}`
    );
  }

  if (contextValues.length > 0) {
    formData.append(
      "context",
      contextValues.join("|")
    );
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error?.message ||
      "ອັບໂຫລດໄປ Cloudinary ບໍ່ສຳເລັດ"
    );
  }

  return result;
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
  const submitButton = form.querySelector(
    'button[type="submit"]'
  );

  if (dateInput) {
    dateInput.value = new Date()
      .toISOString()
      .slice(0, 10);
  }

  let previewObjectUrl = null;

  function previewFile(selectedFile) {
    if (!selectedFile) {
      return;
    }

    message.textContent = "";

    if (!selectedFile.type.startsWith("image/")) {
      message.textContent =
        "ກະລຸນາເລືອກໄຟລ໌ຮູບເທົ່ານັ້ນ";

      fileInput.value = "";
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      message.textContent =
        "ໄຟລ໌ໃຫຍ່ເກີນ 10 MB";

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
  }

  fileInput.addEventListener("change", () => {
    previewFile(fileInput.files[0]);
  });

  ["dragenter", "dragover"].forEach(eventName => {
    dropzone.addEventListener(eventName, event => {
      event.preventDefault();
      dropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropzone.addEventListener(eventName, event => {
      event.preventDefault();
      dropzone.classList.remove("dragover");
    });
  });

  dropzone.addEventListener("drop", event => {
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
        dateInput.value = new Date()
          .toISOString()
          .slice(0, 10);
      }
    }, 0);
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const selectedFile = fileInput.files[0];

    if (!selectedFile) {
      message.textContent =
        "ກະລຸນາເລືອກຮູບເສື້ອ";

      return;
    }

    const name = document
      .querySelector("#shirtName")
      .value
      .trim();

    const category = document
      .querySelector("#shirtCategory")
      .value;

    const code = document
      .querySelector("#designCode")
      .value
      .trim();

    const color = document
      .querySelector("#mainColor")
      .value
      .trim();

    const status = document
      .querySelector("#shirtStatus")
      .value;

    const tags = document
      .querySelector("#shirtTags")
      .value
      .trim();

    const description = document
      .querySelector("#shirtDescription")
      .value
      .trim();

    const featured = document
      .querySelector("#featured")
      .checked;

    // ตรวจสอบรหัสซ้ำเฉพาะปีเดียวกัน
    const currentYear = new Date(dateInput.value).getFullYear();

    const duplicateCode = getShirts().some(item => {

      const itemYear = item.date
        ? new Date(item.date).getFullYear()
        : 0;

      return (
        itemYear === currentYear &&
        String(item.code || "")
          .trim()
          .toLowerCase() ===
        code.trim().toLowerCase()
      );

    });

    if (code && duplicateCode) {
      message.textContent =
        `ລະຫັດ ${code} ຖືກໃຊ້ງານແລ້ວໃນປີ ${currentYear}`;

      document.querySelector("#designCode").focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent =
      "ກຳລັງອັບໂຫລດ...";

    message.textContent =
      "ກຳລັງສົ່ງຮູບພາບຂຶ້ນ Cloudinary " +
      "ກະລຸນາຢ່າປິດໜ້ານີ້";

    try {
      const cloudinaryResult =
        await uploadToCloudinary(
          selectedFile,
          {
            name,
            category,
            code,
            color,
            status,
            tags,
            description
          }
        );

      const item = {
        id: String(Date.now()),
        name,
        category,
        date: dateInput.value,
        code,
        color,
        status,
        tags,
        description,
        featured,
        image: cloudinaryResult.secure_url,
        cloudinaryPublicId:
          cloudinaryResult.public_id,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        bytes: cloudinaryResult.bytes,
        format: cloudinaryResult.format
      };

      const items = getShirts();

      items.unshift(item);
      saveShirts(items);

      message.textContent =
        "ອັບໂຫລດສຳເລັດ " +
        "ກຳລັງເປີດໜ້າແບບເສື້ອ...";

      setTimeout(() => {
        window.location.href = "gallery.html";
      }, 700);

    } catch (error) {
      console.error(error);

      message.textContent =
        error.message ||
        "ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່";

    } finally {
      submitButton.disabled = false;
      submitButton.textContent =
        "ບັນທຶກແບບເສື້ອ";
    }
  });
}

/* =====================================================
   EDIT PAGE
===================================================== */

function initEdit() {
  const form = document.querySelector("#editForm");

  if (!form) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const shirtId = params.get("id");

  const message = document.querySelector("#formMessage");
  const fileInput = document.querySelector("#shirtImage");
  const preview = document.querySelector("#previewImage");
  const dropzoneText = document.querySelector("#dropzoneText");
  const deleteButton = document.querySelector("#deleteShirt");
  const submitButton = form.querySelector('button[type="submit"]');

  let items = getShirts();
  let itemIndex = items.findIndex(item => String(item.id) === String(shirtId));

  if (!shirtId || itemIndex === -1) {
    message.textContent = "ບໍ່ພົບລາຍການທີ່ຕ້ອງແກ້ໄຂ";
    form.querySelectorAll("input, select, textarea, button")
      .forEach(element => {
        element.disabled = true;
      });

    return;
  }

  let currentItem = items[itemIndex];
  let previewObjectUrl = null;

  // นำข้อมูลเดิมใส่ในฟอร์ม
  document.querySelector("#shirtName").value =
    currentItem.name || "";

  document.querySelector("#shirtCategory").value =
    currentItem.category || "football";

  document.querySelector("#uploadDate").value =
    currentItem.date || "";

  document.querySelector("#designCode").value =
    currentItem.code || "";

  document.querySelector("#mainColor").value =
    currentItem.color || "";

  document.querySelector("#shirtStatus").value =
    currentItem.status || "available";

  document.querySelector("#shirtTags").value =
    currentItem.tags || "";

  document.querySelector("#shirtDescription").value =
    currentItem.description || "";

  document.querySelector("#featured").checked =
    currentItem.featured === true;

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

    if (selectedFile.size > 10 * 1024 * 1024) {
      message.textContent = "ໄຟລໃຫຍ່ເກີນ 10 MB";
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
  form.addEventListener("submit", async event => {
    event.preventDefault();

    const newCode = document
      .querySelector("#designCode")
      .value
      .trim();

    const editYear = new Date(
      document.querySelector("#uploadDate").value
    ).getFullYear();

    const duplicateCode = items.some(item => {

      const itemYear = item.date
        ? new Date(item.date).getFullYear()
        : 0;

      return (
        String(item.id) !== String(shirtId) &&
        itemYear === editYear &&
        String(item.code || "")
          .trim()
          .toLowerCase() ===
        newCode.toLowerCase()
      );

    });

    if (newCode && duplicateCode) {
      message.textContent =
        `ລະຫັດ ${newCode} ຖືກໃຊ້ງານແລ້ວໃນປີ ${editYear}`;

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
        format: currentItem.format
      };

      const selectedFile = fileInput.files[0];

      // ถ้าเลือกรูปใหม่ ให้อัปโหลดรูปใหม่ขึ้น Cloudinary
      if (selectedFile) {
        const cloudinaryResult = await uploadToCloudinary(
          selectedFile,
          {
            name: document.querySelector("#shirtName").value.trim(),
            category: document.querySelector("#shirtCategory").value,
            code: document.querySelector("#designCode").value.trim(),
            color: document.querySelector("#mainColor").value.trim(),
            status: document.querySelector("#shirtStatus").value,
            tags: document.querySelector("#shirtTags").value.trim(),
            description: document
              .querySelector("#shirtDescription")
              .value
              .trim()
          }
        );

        imageData = {
          image: cloudinaryResult.secure_url,
          cloudinaryPublicId: cloudinaryResult.public_id,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          bytes: cloudinaryResult.bytes,
          format: cloudinaryResult.format
        };
      }

      items[itemIndex] = {
        ...currentItem,
        name: document.querySelector("#shirtName").value.trim(),
        category: document.querySelector("#shirtCategory").value,
        date: document.querySelector("#uploadDate").value,
        code: document.querySelector("#designCode").value.trim(),
        color: document.querySelector("#mainColor").value.trim(),
        status: document.querySelector("#shirtStatus").value,
        tags: document.querySelector("#shirtTags").value.trim(),
        description: document
          .querySelector("#shirtDescription")
          .value
          .trim(),
        featured: document.querySelector("#featured").checked,
        ...imageData
      };

      saveShirts(items);

      message.textContent = "ບັນທຶກການແກ້ໄຂສຳເລັດ";

      setTimeout(() => {
        window.location.href = "gallery.html";
      }, 700);

    } catch (error) {
      console.error(error);
      message.textContent =
        error.message || "ບັນທຶກການແກ້ໄຂບໍ่ສຳເລັດ";

    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "ບັນທຶກການແກ້ໄຂ";
    }
  });

  // ลบรายการ
  deleteButton.addEventListener("click", () => {
    const confirmed = window.confirm(
      "ຕ້ອງການລົບລາຍການນີ້ອອກຈາກໜ້າສະແດງແບບເສື້ອ ຫຼື ບໍ່?"
    );

    if (!confirmed) {
      return;
    }

    items = items.filter(
      item => String(item.id) !== String(shirtId)
    );

    saveShirts(items);

    message.textContent = "ລົບລາຍການສຳເລັດ";

    setTimeout(() => {
      window.location.href = "gallery.html";
    }, 500);
  });
}

/* =====================================================
   START
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initGallery();
  initUpload();
  initEdit();
});