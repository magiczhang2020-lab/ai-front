function formatDate(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("zh-CN", { hour12: false });
}

async function loadNews() {
  const list = document.getElementById("news-list");
  const updated = document.getElementById("last-updated");

  try {
    const res = await fetch("news.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    updated.textContent = `最后更新：${formatDate(data.updatedAt)}`;

    if (!data.items || data.items.length === 0) {
      list.innerHTML = "<li>暂无新闻。</li>";
      return;
    }

    list.innerHTML = data.items
      .map((item) => {
        const pub = formatDate(item.pubDate);
        return `
          <li>
            <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
            <div class="meta">${item.source || "来源未知"}${pub ? ` · ${pub}` : ""}</div>
          </li>
        `;
      })
      .join("");
  } catch (err) {
    updated.textContent = "加载失败";
    list.innerHTML = `<li>新闻加载失败：${err.message}</li>`;
  }
}

loadNews();
