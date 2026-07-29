const dashboardNames = {
  categories: {
    football: "ເສື້ອກິລາ",
    team: "ເສື້ອທີມງານ",
    company: "ເສື້ອບໍລິສັດ",
    meme: "ເສື້ອມີມ",
  },

  collars: {
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
  },

  sleeves: {
    short: "ແຂນສັ້ນ",
    long: "ແຂນຍາວ",
  },

  shoulders: {
    normal: "ໄຫຼ່ປົກກະຕິ",
    raglan: "ໄຫຼ່ສະຫຼົບ",
  },

  colors: {
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
  },
};

const dashboardColorValues = {
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

function escapeDashboardHtml(value = "") {
  return String(value).replace(
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

function formatDashboardNumber(value) {
  return Number(value || 0).toLocaleString(
    "en-US",
  );
}

function formatDashboardPrice(value) {
  return `${Number(value || 0).toLocaleString(
    "en-US",
  )} ກີບ`;
}

function getStartOfMonth(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  );
}

function getStartOfNextMonth(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    1,
  );
}

function isDateWithin(dateValue, start, end) {
  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date >= start && date < end;
}

function groupCount(values) {
  const result = {};

  values.forEach((value) => {
    const key =
      value === null ||
      value === undefined ||
      value === ""
        ? "unknown"
        : String(value);

    result[key] = (result[key] || 0) + 1;
  });

  return Object.entries(result)
    .map(([key, count]) => ({
      key,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function normalizeColors(colors) {
  if (Array.isArray(colors)) {
    return colors;
  }

  if (typeof colors === "string") {
    try {
      const parsed = JSON.parse(colors);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return colors
        .split(",")
        .map((color) => color.trim())
        .filter(Boolean);
    }
  }

  return [];
}

async function requireDashboardSession() {
  if (!window.supabaseClient) {
    throw new Error(
      "ບໍ່ພົບການເຊື່ອມຕໍ່ Supabase",
    );
  }

  const {
    data: { session },
    error,
  } = await window.supabaseClient.auth
    .getSession();

  if (error) {
    throw error;
  }

  if (!session) {
    window.location.href = "login.html";
    return false;
  }

  return true;
}

async function fetchDashboardData() {
  const shirtsRequest =
    window.supabaseClient
      .from("shirts")
      .select(
        [
          "id",
          "name",
          "design_code",
          "category",
          "collar",
          "sleeve",
          "shoulder",
          "colors",
          "price",
          "upload_date",
          "image",
          "cloudinary_public_id",
        ].join(","),
      );

  const analyticsRequest =
    window.supabaseClient
      .from("analytics_events")
      .select(
        [
          "id",
          "event_type",
          "shirt_id",
          "shirt_name",
          "created_at",
        ].join(","),
      )
      .order("created_at", {
        ascending: true,
      });

  const [
    shirtsResult,
    analyticsResult,
  ] = await Promise.all([
    shirtsRequest,
    analyticsRequest,
  ]);

  if (shirtsResult.error) {
    throw shirtsResult.error;
  }

  if (analyticsResult.error) {
    throw analyticsResult.error;
  }

  return {
    shirts: Array.isArray(shirtsResult.data)
      ? shirtsResult.data
      : [],

    events: Array.isArray(analyticsResult.data)
      ? analyticsResult.data
      : [],
  };
}

function createShirtMap(shirts) {
  const map = new Map();

  shirts.forEach((shirt) => {
    map.set(String(shirt.id), shirt);
  });

  return map;
}

function buildEventStats(events) {
  const stats = new Map();

  events.forEach((event) => {
    const shirtId =
      event.shirt_id !== null &&
      event.shirt_id !== undefined
        ? String(event.shirt_id)
        : "";

    if (!shirtId) {
      return;
    }

    if (!stats.has(shirtId)) {
      stats.set(shirtId, {
        modal: 0,
        fullImage: 0,
        whatsapp: 0,
        fallbackName:
          event.shirt_name || "",
      });
    }

    const item = stats.get(shirtId);

    if (event.event_type === "modal_open") {
      item.modal += 1;
    }

    if (
      event.event_type ===
      "full_image_open"
    ) {
      item.fullImage += 1;
    }

    if (
      event.event_type ===
      "whatsapp_click"
    ) {
      item.whatsapp += 1;
    }
  });

  return stats;
}

function renderOverview(shirts, events) {
  const modalOpens = events.filter(
    (event) =>
      event.event_type === "modal_open",
  ).length;

  const fullImageOpens = events.filter(
    (event) =>
      event.event_type ===
      "full_image_open",
  ).length;

  const whatsappClicks = events.filter(
    (event) =>
      event.event_type ===
      "whatsapp_click",
  ).length;

  const conversion =
    modalOpens > 0
      ? (whatsappClicks / modalOpens) * 100
      : 0;

  document.querySelector(
    "#totalShirts",
  ).textContent =
    formatDashboardNumber(shirts.length);

  document.querySelector(
    "#modalOpens",
  ).textContent =
    formatDashboardNumber(modalOpens);

  document.querySelector(
    "#fullImageOpens",
  ).textContent =
    formatDashboardNumber(fullImageOpens);

  document.querySelector(
    "#whatsappClicks",
  ).textContent =
    formatDashboardNumber(whatsappClicks);

  document.querySelector(
    "#conversionRate",
  ).textContent =
    `${conversion.toFixed(2)}%`;
}

function buildShirtRanking(
  shirts,
  events,
) {
  const shirtMap = createShirtMap(shirts);
  const eventStats = buildEventStats(events);

  const ids = new Set([
    ...shirtMap.keys(),
    ...eventStats.keys(),
  ]);

  return Array.from(ids)
    .map((id) => {
      const shirt = shirtMap.get(id);
      const stats =
        eventStats.get(id) || {
          modal: 0,
          fullImage: 0,
          whatsapp: 0,
          fallbackName: "",
        };

      return {
        id,
        name:
          shirt?.name ||
          stats.fallbackName ||
          "ບໍ່ມີຊື່",

        code:
          shirt?.design_code || "",

        cloudinaryPublicId:
          shirt?.cloudinary_public_id || "",

        modal: stats.modal,
        fullImage: stats.fullImage,
        whatsapp: stats.whatsapp,
      };
    });
}

function createGalleryLink(item) {
  if (!item.cloudinaryPublicId) {
    return "gallery.html";
  }

  return (
    "gallery.html?shirt=" +
    encodeURIComponent(
      item.cloudinaryPublicId,
    )
  );
}

function renderPopularShirts(ranking) {
  const body = document.querySelector(
    "#popularShirtsBody",
  );

  const items = [...ranking]
    .sort(
      (a, b) =>
        b.modal - a.modal ||
        b.fullImage - a.fullImage ||
        b.whatsapp - a.whatsapp,
    )
    .slice(0, 10);

  if (items.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="5">
          ຍັງບໍ່ມີຂໍ້ມູນ
        </td>
      </tr>
    `;

    return;
  }

  body.innerHTML = items
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>

          <td>
            <a
              href="${createGalleryLink(item)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${escapeDashboardHtml(item.name)}
            </a>

            ${
              item.code
                ? `<small>
                    ${escapeDashboardHtml(
                      item.code,
                    )}
                  </small>`
                : ""
            }
          </td>

          <td>
            ${formatDashboardNumber(
              item.modal,
            )}
          </td>

          <td>
            ${formatDashboardNumber(
              item.fullImage,
            )}
          </td>

          <td>
            ${formatDashboardNumber(
              item.whatsapp,
            )}
          </td>
        </tr>
      `,
    )
    .join("");
}

function renderWhatsappRanking(ranking) {
  const container = document.querySelector(
    "#whatsappRanking",
  );

  const items = [...ranking]
    .filter((item) => item.whatsapp > 0)
    .sort(
      (a, b) =>
        b.whatsapp - a.whatsapp ||
        b.modal - a.modal,
    )
    .slice(0, 10);

  if (items.length === 0) {
    container.innerHTML = `
      <p class="panel-empty">
        ຍັງບໍ່ມີການກົດ WhatsApp
      </p>
    `;

    return;
  }

  container.innerHTML = items
    .map(
      (item, index) => `
        <div class="ranking-item">
          <span class="ranking-number">
            ${index + 1}
          </span>

          <div class="ranking-info">
            <a
              href="${createGalleryLink(item)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${escapeDashboardHtml(item.name)}
            </a>

            <small>
              ${escapeDashboardHtml(
                item.code || "ບໍ່ມີລະຫັດ",
              )}
            </small>
          </div>

          <strong class="ranking-count">
            ${formatDashboardNumber(
              item.whatsapp,
            )}
          </strong>
        </div>
      `,
    )
    .join("");
}

function renderBarChart(
  containerSelector,
  data,
  options = {},
) {
  const container =
    document.querySelector(
      containerSelector,
    );

  const items = data.slice(
    0,
    options.limit || 10,
  );

  if (!items.length) {
    container.innerHTML = `
      <p class="panel-empty">
        ຍັງບໍ່ມີຂໍ້ມູນ
      </p>
    `;

    return;
  }

  const maximum = Math.max(
    ...items.map((item) => item.count),
    1,
  );

  container.innerHTML = items
    .map((item) => {
      const percentage =
        (item.count / maximum) * 100;

      const label =
        options.nameMap?.[item.key] ||
        (item.key === "unknown"
          ? "ບໍ່ລະບຸ"
          : item.key);

      const dot =
        options.showColorDot
          ? `
            <span
              class="bar-color-dot"
              style="background:${
                dashboardColorValues[
                  item.key
                ] || "#d0d5dd"
              }"
            ></span>
          `
          : "";

      return `
        <div class="bar-row">
          <div class="bar-heading">
            <span class="bar-label">
              ${dot}

              <span class="bar-label-text">
                ${escapeDashboardHtml(
                  label,
                )}
              </span>
            </span>

            <span class="bar-value">
              ${formatDashboardNumber(
                item.count,
              )}
            </span>
          </div>

          <div class="bar-track">
            <div
              class="bar-fill"
              style="width:${percentage}%"
            ></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderDistributionCharts(shirts) {
  const allColors = shirts.flatMap(
    (shirt) =>
      normalizeColors(shirt.colors),
  );

  renderBarChart(
    "#colorChart",
    groupCount(allColors),
    {
      nameMap: dashboardNames.colors,
      showColorDot: true,
      limit: 10,
    },
  );

  renderBarChart(
    "#collarChart",
    groupCount(
      shirts.map(
        (shirt) => shirt.collar,
      ),
    ),
    {
      nameMap: dashboardNames.collars,
      limit: 13,
    },
  );

  renderBarChart(
    "#sleeveChart",
    groupCount(
      shirts.map(
        (shirt) => shirt.sleeve,
      ),
    ),
    {
      nameMap: dashboardNames.sleeves,
    },
  );

  renderBarChart(
    "#shoulderChart",
    groupCount(
      shirts.map(
        (shirt) => shirt.shoulder,
      ),
    ),
    {
      nameMap:
        dashboardNames.shoulders,
    },
  );

  renderBarChart(
    "#categoryChart",
    groupCount(
      shirts.map(
        (shirt) => shirt.category,
      ),
    ),
    {
      nameMap:
        dashboardNames.categories,
    },
  );

  const priceCounts = groupCount(
    shirts.map((shirt) =>
      Number(shirt.price || 0),
    ),
  ).map((item) => ({
    ...item,
    key:
      Number(item.key) > 0
        ? formatDashboardPrice(item.key)
        : "ບໍ່ລະບຸລາຄາ",
  }));

  renderBarChart(
    "#priceChart",
    priceCounts,
    {
      limit: 10,
    },
  );
}

function renderUploadComparison(shirts) {
  const now = new Date();

  const thisMonthStart =
    getStartOfMonth(now);

  const nextMonthStart =
    getStartOfNextMonth(now);

  const lastMonthDate = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  );

  const lastMonthStart =
    getStartOfMonth(lastMonthDate);

  const thisMonthCount = shirts.filter(
    (shirt) =>
      isDateWithin(
        shirt.upload_date,
        thisMonthStart,
        nextMonthStart,
      ),
  ).length;

  const lastMonthCount = shirts.filter(
    (shirt) =>
      isDateWithin(
        shirt.upload_date,
        lastMonthStart,
        thisMonthStart,
      ),
  ).length;

  document.querySelector(
    "#uploadsThisMonth",
  ).textContent =
    formatDashboardNumber(
      thisMonthCount,
    );

  document.querySelector(
    "#uploadsLastMonth",
  ).textContent =
    formatDashboardNumber(
      lastMonthCount,
    );
}

function getLast30Days() {
  const days = [];
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  for (let index = 29; index >= 0; index--) {
    const date = new Date(today);

    date.setDate(
      today.getDate() - index,
    );

    const key = [
      date.getFullYear(),
      String(
        date.getMonth() + 1,
      ).padStart(2, "0"),
      String(date.getDate()).padStart(
        2,
        "0",
      ),
    ].join("-");

    days.push({
      date,
      key,
      count: 0,
    });
  }

  return days;
}

function renderDailyChart(events) {
  const container = document.querySelector(
    "#dailyChart",
  );

  const days = getLast30Days();

  const dayMap = new Map(
    days.map((day) => [
      day.key,
      day,
    ]),
  );

  events
    .filter(
      (event) =>
        event.event_type ===
        "modal_open",
    )
    .forEach((event) => {
      if (!event.created_at) {
        return;
      }

      const eventDate = new Date(
        event.created_at,
      );

      if (
        Number.isNaN(
          eventDate.getTime(),
        )
      ) {
        return;
      }

      const key = [
        eventDate.getFullYear(),
        String(
          eventDate.getMonth() + 1,
        ).padStart(2, "0"),
        String(
          eventDate.getDate(),
        ).padStart(2, "0"),
      ].join("-");

      const day = dayMap.get(key);

      if (day) {
        day.count += 1;
      }
    });

  const width = 760;
  const height = 230;

  const padding = {
    top: 18,
    right: 16,
    bottom: 35,
    left: 36,
  };

  const chartWidth =
    width -
    padding.left -
    padding.right;

  const chartHeight =
    height -
    padding.top -
    padding.bottom;

  const maximum = Math.max(
    ...days.map((day) => day.count),
    1,
  );

  const points = days.map(
    (day, index) => {
      const x =
        padding.left +
        (index /
          Math.max(days.length - 1, 1)) *
          chartWidth;

      const y =
        padding.top +
        chartHeight -
        (day.count / maximum) *
          chartHeight;

      return {
        ...day,
        x,
        y,
      };
    },
  );

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ` +
        `${point.x.toFixed(2)} ` +
        `${point.y.toFixed(2)}`,
    )
    .join(" ");

  const firstPoint = points[0];
  const lastPoint =
    points[points.length - 1];

  const areaPath =
    `${linePath} ` +
    `L ${lastPoint.x} ` +
    `${padding.top + chartHeight} ` +
    `L ${firstPoint.x} ` +
    `${padding.top + chartHeight} Z`;

  const labelIndexes = [
    0,
    7,
    14,
    21,
    29,
  ];

  container.innerHTML = `
    <svg
      class="daily-svg"
      viewBox="0 0 ${width} ${height}"
      role="img"
      aria-label="30 day modal chart"
    >
      <line
        x1="${padding.left}"
        y1="${padding.top + chartHeight}"
        x2="${width - padding.right}"
        y2="${padding.top + chartHeight}"
        stroke="#e4e7ec"
      ></line>

      <path
        class="daily-area"
        d="${areaPath}"
      ></path>

      <path
        class="daily-line"
        d="${linePath}"
      ></path>

      ${points
        .filter(
          (_, index) =>
            index % 3 === 0 ||
            index === points.length - 1,
        )
        .map(
          (point) => `
            <circle
              class="daily-point"
              cx="${point.x}"
              cy="${point.y}"
              r="3.5"
            >
              <title>
                ${point.key}: ${point.count}
              </title>
            </circle>
          `,
        )
        .join("")}

      ${labelIndexes
        .map((index) => {
          const point = points[index];

          const label =
            `${String(
              point.date.getDate(),
            ).padStart(2, "0")}/` +
            `${String(
              point.date.getMonth() + 1,
            ).padStart(2, "0")}`;

          return `
            <text
              class="daily-axis-label"
              x="${point.x}"
              y="${
                padding.top +
                chartHeight +
                23
              }"
              text-anchor="middle"
            >
              ${label}
            </text>
          `;
        })
        .join("")}

      <text
        class="daily-axis-label"
        x="${padding.left - 8}"
        y="${padding.top + 4}"
        text-anchor="end"
      >
        ${maximum}
      </text>

      <text
        class="daily-axis-label"
        x="${padding.left - 8}"
        y="${padding.top + chartHeight + 4}"
        text-anchor="end"
      >
        0
      </text>
    </svg>
  `;
}

async function loadDashboard() {
  const message = document.querySelector(
    "#dashboardMessage",
  );

  const refreshButton =
    document.querySelector(
      "#refreshDashboard",
    );

  try {
    message.classList.remove("error");

    message.textContent =
      "ກຳລັງໂຫຼດຂໍ້ມູນ...";

    refreshButton.disabled = true;

    const hasSession =
      await requireDashboardSession();

    if (!hasSession) {
      return;
    }

    const {
      shirts,
      events,
    } = await fetchDashboardData();

    renderOverview(shirts, events);

    const ranking =
      buildShirtRanking(
        shirts,
        events,
      );

    renderPopularShirts(ranking);
    renderWhatsappRanking(ranking);
    renderDistributionCharts(shirts);
    renderUploadComparison(shirts);
    renderDailyChart(events);

    const updateTime =
      new Intl.DateTimeFormat(
        "lo-LA",
        {
          dateStyle: "medium",
          timeStyle: "short",
        },
      ).format(new Date());

    document.querySelector(
      "#lastUpdated",
    ).textContent =
      `ອັບເດດ: ${updateTime}`;

    message.textContent =
      `ໂຫຼດສຳເລັດ: ` +
      `${formatDashboardNumber(
        shirts.length,
      )} ແບບ, ` +
      `${formatDashboardNumber(
        events.length,
      )} ເຫດການ`;
  } catch (error) {
    console.error(
      "Dashboard error:",
      error,
    );

    message.classList.add("error");

    message.textContent =
      error.message ||
      "ບໍ່ສາມາດໂຫຼດ Dashboard";
  } finally {
    refreshButton.disabled = false;
  }
}

async function logoutDashboard() {
  if (!window.supabaseClient) {
    return;
  }

  const { error } =
    await window.supabaseClient.auth
      .signOut();

  if (error) {
    console.error(
      "Logout error:",
      error,
    );

    return;
  }

  window.location.href = "login.html";
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    document
      .querySelector(
        "#refreshDashboard",
      )
      ?.addEventListener(
        "click",
        loadDashboard,
      );

    document
      .querySelector(
        "#dashboardLogout",
      )
      ?.addEventListener(
        "click",
        logoutDashboard,
      );

    loadDashboard();
  },
);