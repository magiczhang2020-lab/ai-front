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

function renderList(items) {
  const list = document.getElementById("news-list");

  if (items.length === 0) {
    list.innerHTML = "<li>没有匹配的新闻。</li>";
    return;
  }

  list.innerHTML = items
    .map((item) => {
      const pub = formatDate(item.pubDate);
      const source = item.source || "来源未知";
      return `
        <li>
          <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>
          <div class="meta">${escapeHtml(source)}${pub ? ` · ${escapeHtml(pub)}` : ""}</div>
        </li>
      `;
    })
    .join("");
}

function uniqueSources(items) {
  const set = new Set();
  items.forEach((item) => {
    if (item.source) set.add(item.source);
  });
  return [...set].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

async function loadNews() {
  const updated = document.getElementById("last-updated");
  const totalCount = document.getElementById("total-count");
  const searchInput = document.getElementById("search-input");
  const sourceSelect = document.getElementById("source-select");
  const sortBtn = document.getElementById("sort-btn");

  try {
    const res = await fetch("news.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const allItems = Array.isArray(data.items) ? data.items.slice() : [];

    updated.textContent = `最后更新：${formatDate(data.updatedAt) || "未知"}`;
    totalCount.textContent = `${allItems.length} 篇`;

    uniqueSources(allItems).forEach((source) => {
      const op = document.createElement("option");
      op.value = source;
      op.textContent = source;
      sourceSelect.appendChild(op);
    });

    const state = {
      q: "",
      source: "all",
      sort: "desc",
    };

    const apply = () => {
      const q = state.q.trim().toLowerCase();
      let items = allItems.filter((it) => {
        if (state.source !== "all" && (it.source || "") !== state.source) return false;
        if (!q) return true;
        const hay = `${it.title || ""} ${it.source || ""}`.toLowerCase();
        return hay.includes(q);
      });

      items = items.sort((a, b) => {
        const diff = parseTimestamp(a.pubDate) - parseTimestamp(b.pubDate);
        return state.sort === "asc" ? diff : -diff;
      });

      totalCount.textContent = `${items.length} / ${allItems.length} 篇`;
      renderList(items);
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
      sortBtn.dataset.sort = state.sort;
      sortBtn.textContent =
        state.sort === "desc" ? "按时间: 最新优先" : "按时间: 最早优先";
      apply();
    });

    apply();
  } catch (err) {
    updated.textContent = "加载失败";
    document.getElementById("news-list").innerHTML = `<li>新闻加载失败：${escapeHtml(err.message)}</li>`;
  }
}

loadNews();
