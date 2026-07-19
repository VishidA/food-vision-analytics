const API_BASE = "http://127.0.0.1:8080/api/v1";
const PAGE_SIZE = 10;

const state = {
  token: localStorage.getItem("fva_token") || null,
  username: localStorage.getItem("fva_username") || null,
  historySkip: 0,
};

const el = {
  authScreen: document.getElementById("authScreen"),
  appScreen: document.getElementById("appScreen"),
  userBar: document.getElementById("userBar"),
  userName: document.getElementById("userName"),
  logoutBtn: document.getElementById("logoutBtn"),

  tabs: document.querySelectorAll(".tab"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),

  uploadForm: document.getElementById("uploadForm"),
  uploadBtn: document.getElementById("uploadBtn"),
  photoInput: document.getElementById("photoInput"),
  photoPreview: document.getElementById("photoPreview"),
  dropzoneHint: document.getElementById("dropzoneHint"),
  resultCard: document.getElementById("resultCard"),

  historyList: document.getElementById("historyList"),
  historyTotals: document.getElementById("historyTotals"),
  refreshHistoryBtn: document.getElementById("refreshHistoryBtn"),
  prevPageBtn: document.getElementById("prevPageBtn"),
  nextPageBtn: document.getElementById("nextPageBtn"),
  pageLabel: document.getElementById("pageLabel"),
};

function setMsg(scope, text, isError) {
  const node = document.querySelector(`[data-msg="${scope}"]`);
  if (!node) return;
  node.textContent = text || "";
  node.classList.toggle("is-error", Boolean(isError));
  node.classList.toggle("is-ok", !isError && Boolean(text));
}

async function apiFetch(path, options = {}) {
  const headers = options.headers || {};
  if (state.token) headers["Authorization"] = `Bearer ${state.token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch (_) {
    }
    throw new Error(detail);
  }

  if (response.status === 204) return null;
  return response.json();
}

function fmt(value, decimals = 1) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(decimals) : "-";
}

function fmtDateTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("uk-UA", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function formatClassName(rawName) {
  if (!rawName) return "";
  return rawName
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function productLabel(entry) {
  if (entry.product_name) return formatClassName(entry.product_name);
  return `Product #${entry.product_id}`;
}

el.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    el.tabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    const target = tab.dataset.tab;
    el.loginForm.classList.toggle("hidden", target !== "login");
    el.registerForm.classList.toggle("hidden", target !== "register");
  });
});

el.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(el.registerForm);
  setMsg("register", "Створюємо акаунт…", false);

  try {
    await apiFetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        name: form.get("name"),
        password: form.get("password"),
      }),
    });
    setMsg("register", "Акаунт створено. Тепер увійди на вкладці «Увійти».", false);
    el.registerForm.reset();
  } catch (err) {
    setMsg("register", err.message, true);
  }
});

el.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(el.loginForm);
  setMsg("login", "Входимо…", false);

  const body = new URLSearchParams();
  body.set("username", form.get("username"));
  body.set("password", form.get("password"));

  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    state.token = data.access_token;
    state.username = form.get("username");
    localStorage.setItem("fva_token", state.token);
    localStorage.setItem("fva_username", state.username);
    el.loginForm.reset();
    enterApp();
  } catch (err) {
    setMsg("login", err.message, true);
  }
});

el.logoutBtn.addEventListener("click", () => {
  state.token = null;
  state.username = null;
  localStorage.removeItem("fva_token");
  localStorage.removeItem("fva_username");
  el.appScreen.classList.add("hidden");
  el.userBar.classList.add("hidden");
  el.authScreen.classList.remove("hidden");
});

function enterApp() {
  el.authScreen.classList.add("hidden");
  el.appScreen.classList.remove("hidden");
  el.userBar.classList.remove("hidden");
  el.userName.textContent = state.username || "";
  state.historySkip = 0;
  loadHistory();
}

el.photoInput.addEventListener("change", () => {
  const file = el.photoInput.files[0];
  if (!file) return;
  el.dropzoneHint.classList.add("hidden");
  el.photoPreview.src = URL.createObjectURL(file);
  el.photoPreview.classList.remove("hidden");
});

el.uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = el.photoInput.files[0];
  if (!file) {
    setMsg("upload", "Обери фото перед відправкою.", true);
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    setMsg("upload", "Файл більший за 10 МБ - за FR-2 це поза лімітом.", true);
    return;
  }

  const weight = document.getElementById("weightInput").value;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("weight_grams", weight);

  el.uploadBtn.disabled = true;
  el.uploadBtn.textContent = "Розпізнаємо…";
  setMsg("upload", "", false);
  el.resultCard.classList.add("hidden");

  try {
    const result = await apiFetch("/consumption/upload", {
      method: "POST",
      body: formData,
    });
    renderResult(result);
    setMsg("upload", "Готово, збережено в історію.", false);
    state.historySkip = 0;
    loadHistory();
  } catch (err) {
    setMsg("upload", err.message, true);
  } finally {
    el.uploadBtn.disabled = false;
    el.uploadBtn.textContent = "Розпізнати та зберегти";
  }
});

function renderResult(entry) {
  el.resultCard.innerHTML = `
    <div class="nutrition-label__eyebrow">Результат розпізнавання</div>
    <div class="nutrition-label__title">${productLabel(entry)}</div>
    ${
      typeof entry.confidence === "number"
        ? `<div class="nutrition-label__warning" style="border-color:var(--herb);color:var(--herb);">впевненість ${(entry.confidence * 100).toFixed(0)}%</div>`
        : ""
    }
    <div class="nutrition-label__row nutrition-label__row--big">
      <span class="nutrition-label__key">Калорії</span>
      <span class="nutrition-label__val">${fmt(entry.log_calories)} ккал</span>
    </div>
    <div class="nutrition-label__row">
      <span class="nutrition-label__key">Білки</span>
      <span class="nutrition-label__val">${fmt(entry.log_protein)} г</span>
    </div>
    <div class="nutrition-label__row">
      <span class="nutrition-label__key">Жири</span>
      <span class="nutrition-label__val">${fmt(entry.log_fat)} г</span>
    </div>
    <div class="nutrition-label__row">
      <span class="nutrition-label__key">Вуглеводи</span>
      <span class="nutrition-label__val">${fmt(entry.log_carbs)} г</span>
    </div>
    <div class="nutrition-label__meta">
      Порція: ${fmt(entry.weight, 0)} г · ${fmtDateTime(entry.consumed_time)} · запис #${entry.id}
    </div>
    <div class="nutrition-label__meta" style="margin-top:6px;">
      Оцінка є орієнтовною і не є медичною рекомендацією.
    </div>
  `;
  el.resultCard.classList.remove("hidden");
}

el.refreshHistoryBtn.addEventListener("click", () => {
  state.historySkip = 0;
  loadHistory();
});

el.prevPageBtn.addEventListener("click", () => {
  state.historySkip = Math.max(0, state.historySkip - PAGE_SIZE);
  loadHistory();
});

el.nextPageBtn.addEventListener("click", () => {
  state.historySkip += PAGE_SIZE;
  loadHistory();
});

async function loadHistory() {
  el.historyList.innerHTML = `<div class="empty-state">Завантаження…</div>`;
  try {
    const logs = await apiFetch(
      `/consumption/history?skip=${state.historySkip}&limit=${PAGE_SIZE}`
    );
    renderHistory(logs);
  } catch (err) {
    el.historyList.innerHTML = `<div class="empty-state">Не вдалося завантажити історію: ${err.message}</div>`;
    el.historyTotals.innerHTML = "";
  }
}

function renderHistory(logs) {
  el.pageLabel.textContent = `${state.historySkip / PAGE_SIZE + 1}`;
  el.prevPageBtn.disabled = state.historySkip === 0;
  el.nextPageBtn.disabled = logs.length < PAGE_SIZE;

  if (!logs.length) {
    el.historyList.innerHTML = `<div class="empty-state">Записів поки немає - заванта перше фото зліва.</div>`;
    el.historyTotals.innerHTML = "";
    return;
  }

  const totals = logs.reduce(
    (acc, log) => {
      acc.calories += Number(log.log_calories) || 0;
      acc.protein += Number(log.log_protein) || 0;
      acc.fat += Number(log.log_fat) || 0;
      acc.carbs += Number(log.log_carbs) || 0;
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  el.historyTotals.innerHTML = `
    <div class="totals-strip__item">
      <span class="totals-strip__label">Ккал (сторінка)</span>
      <span class="totals-strip__value">${fmt(totals.calories, 0)}</span>
    </div>
    <div class="totals-strip__item">
      <span class="totals-strip__label">Білки</span>
      <span class="totals-strip__value">${fmt(totals.protein, 0)}г</span>
    </div>
    <div class="totals-strip__item">
      <span class="totals-strip__label">Жири</span>
      <span class="totals-strip__value">${fmt(totals.fat, 0)}г</span>
    </div>
    <div class="totals-strip__item">
      <span class="totals-strip__label">Вуглеводи</span>
      <span class="totals-strip__value">${fmt(totals.carbs, 0)}г</span>
    </div>
  `;

  el.historyList.innerHTML = logs
    .map(
      (log) => `
    <div class="history-row">
      <span class="history-row__product">${productLabel(log)}</span>
      <span class="history-row__time">${fmtDateTime(log.consumed_time)}</span>
      <span class="history-row__weight">${fmt(log.weight, 0)} г</span>
      <span class="history-row__cal">${fmt(log.log_calories, 0)} ккал</span>
    </div>
  `
    )
    .join("");
}

if (state.token) {
  enterApp();
}
