function formatDate(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("zh-CN", { hour12: false });
}

function parseTimestamp(input) {
  const t = Date.parse(input || "");
  return Number.isNaN(t) ? 0 : t;
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function categoryOf(item) {
  const text = `${item.title || ""} ${item.source || ""}`.toLowerCase();
  if (text.includes("security") || text.includes("privacy") || text.includes("hack")) return "security";
  if (text.includes("startup") || text.includes("fund") || text.includes("venture")) return "startups";
  if (text.includes("app") || text.includes("mobile") || text.includes("ios") || text.includes("android")) return "apps";
  if (text.includes("transport") || text.includes("ev") || text.includes("uber") || text.includes("tesla")) return "transportation";
  if (text.includes("ai") || text.includes("openai") || text.includes("anthropic") || text.includes("llm")) return "ai";
  return "venture";
}

function prettyCategory(cat) {
  const map = {
    ai: "AI",
    startups: "Startups",
    apps: "Apps",
    security: "Security",
    venture: "Venture",
    transportation: "Transportation",
  };
  return map[cat] || "News";
}

function cardHtml(item) {
  const pub = formatDate(item.pubDate);
  const source = item.source || "Unknown";
  const cat = prettyCategory(categoryOf(item));
  return `
    <span class="category">${escapeHtml(cat)}</span>
    <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>
    <div class="meta">${escapeHtml(source)}${pub ? ` · ${escapeHtml(pub)}` : ""}</div>
  `;
}

function renderSections(items) {
  const lead = document.getElementById("lead-story");
  const secondary = document.getElementById("secondary-list");
  const list = document.getElementById("news-list");
  const popular = document.getElementById("popular-list");

  if (items.length === 0) {
    lead.innerHTML = "<p>没有匹配的新闻。</p>";
    secondary.innerHTML = "";
    list.innerHTML = "";
    popular.innerHTML = "";
    return;
  }

  const leadItem = items[0];
  const secondaryItems = items.slice(1, 5);
  const feedItems = items.slice(5);
  const popularItems = items.slice(0, 8);

  lead.innerHTML = cardHtml(leadItem);
  secondary.innerHTML = secondaryItems.map((i) => `<li>${cardHtml(i)}</li>`).join("");
  list.innerHTML = feedItems.map((i) => `<li>${cardHtml(i)}</li>`).join("");
  popular.innerHTML = popularItems
    .map(
      (i) =>
        `<li><a href="${escapeHtml(i.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(i.title)}</a><span class="meta">${escapeHtml(i.source || "Unknown")}</span></li>`
    )
    .join("");
}

function uniqueSources(items) {
  return [...new Set(items.map((item) => item.source).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "zh-CN")
  );
}

async function loadNews() {
  const updated = document.getElementById("last-updated");
  const count = document.getElementById("total-count");
  const searchInput = document.getElementById("search-input");
  const sourceSelect = document.getElementById("source-select");
  const sortBtn = document.getElementById("sort-btn");
  const topicsNav = document.getElementById("topics-nav");

  try {
    const res = await fetch("news.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const allItems = Array.isArray(data.items) ? data.items.slice() : [];

    updated.textContent = `Updated: ${formatDate(data.updatedAt) || "Unknown"}`;

    uniqueSources(allItems).forEach((source) => {
      const op = document.createElement("option");
      op.value = source;
      op.textContent = source;
      sourceSelect.appendChild(op);
    });

    const state = { q: "", source: "all", sort: "desc", topic: "all" };

    const apply = () => {
      const q = state.q.trim().toLowerCase();
      let items = allItems.filter((it) => {
        if (state.topic !== "all" && categoryOf(it) !== state.topic) return false;
        if (state.source !== "all" && (it.source || "") !== state.source) return false;
        if (!q) return true;
        return `${it.title || ""} ${it.source || ""}`.toLowerCase().includes(q);
      });

      items = items.sort((a, b) => {
        const diff = parseTimestamp(a.pubDate) - parseTimestamp(b.pubDate);
        return state.sort === "asc" ? diff : -diff;
      });

      count.textContent = `${items.length} / ${allItems.length} stories`;
      renderSections(items);
    };

    searchInput.addEventListener("input", (e) => {
      state.q = e.target.value;
      apply();
    });

    sourceSelect.addEventListener("change", (e) => {
      state.source = e.target.value;
      apply();
    });

    sortBtn.addEventListener("click", () => {
      state.sort = state.sort === "desc" ? "asc" : "desc";
      sortBtn.textContent = state.sort === "desc" ? "Latest first" : "Oldest first";
      apply();
    });

    topicsNav.addEventListener("click", (e) => {
      const btn = e.target.closest(".topic-tab");
      if (!btn) return;
      state.topic = btn.dataset.topic || "all";
      topicsNav.querySelectorAll(".topic-tab").forEach((el) => el.classList.remove("active"));
      btn.classList.add("active");
      apply();
    });

    apply();
  } catch (err) {
    updated.textContent = "加载失败";
    document.getElementById("lead-story").innerHTML = `<p>新闻加载失败：${escapeHtml(err.message)}</p>`;
  }
}

loadNews();
