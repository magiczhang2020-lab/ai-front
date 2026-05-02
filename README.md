# AI 热点新闻站点（GitHub 免费托管）

这个项目会自动抓取 AI 相关新闻并发布到 GitHub Pages。

## 功能

- 前端静态页面：`site/`
- 定时抓取新闻：`.github/workflows/update-news.yml`（每小时）
- 自动部署页面：`.github/workflows/deploy-pages.yml`
- 抓取脚本：`scripts/fetch_news.py`

## 部署步骤

1. 把仓库推到你的 GitHub（默认分支建议 `main`）。
2. 在 GitHub 仓库中打开 `Settings -> Pages`。
3. `Source` 选择 `GitHub Actions`。
4. 在 `Actions` 页面手动运行一次 `Update AI News`（可选，用于立即生成最新内容）。
5. 等待 `Deploy GitHub Pages` 工作流成功。
6. 访问站点地址：`https://<你的GitHub用户名>.github.io/<仓库名>/`

## 说明

- 本地环境如果没有外网，抓取脚本会拿不到新闻；在 GitHub Actions 上会正常执行。
- 你可以在 `scripts/fetch_news.py` 里修改 RSS 源，定制成你自己的 AI 资讯来源。
