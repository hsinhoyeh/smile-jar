# 😊 Smile Jar

A tiny **daily-smile reward tracker** for families. Set a goal, record a
reason every time your kid earns a smile, and watch the jar fill up.

Bilingual out of the box: **English** + **繁體中文 (zh-TW)** with 注音 (zhuyin /
bopomofo) annotations on every Chinese character. 100% static — no build
step, no backend, **no login** — everything stays on your device
(`localStorage`). Deploys straight to **GitHub Pages**.

> 笑臉罐 — 給家庭用的每日笑臉獎勵紀錄工具。設定目標、寫下每一次獲得笑臉的原
> 因，看著罐子慢慢裝滿。純靜態網頁，不需要登入，資料只存在你的裝置上。

**Live site:** https://hsinhoyeh.github.io/smile-jar/

---

## ✨ Features

- **Multiple kids**, each with their own adjustable goal (default 99 smiles)
  and a pick-your-own emoji avatar.
- **Record a smile** with a required reason — a running log of what earned
  it, not just a number.
- **Jar dashboard** — a fill-up jar + progress bar showing how close each
  kid is to their goal, plus a lifetime total.
- **Goal reached** celebration, with the option to raise the goal or start a
  fresh jar (history is always kept).
- **Bilingual** EN / 繁中 with zhuyin, switchable anytime — no page reload.
- **No login, no backend.** All data lives in the browser's `localStorage`
  on that one device.

## 🗂 Project structure

```
index.html        — single-page app shell + modals
css/style.css      — all styling (jar visual, modals, zhuyin, layout)
js/i18n.js         — EN / zh-TW strings + language switching
js/zhuyin.js       — Bopomofo annotation engine for zh-TW text
js/store.js        — localStorage CRUD for kids + smile rewards
js/app.js          — rendering & UI wiring
```

## 🚀 Local development

No build step needed — just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## 📦 Deploy

Pushes to `master` deploy automatically via
`.github/workflows/deploy.yml` (GitHub Pages, `actions/deploy-pages`).

## 🔒 Privacy

Nothing is sent anywhere. Kids, goals, and every recorded smile live only
in the browser's `localStorage` on the device you're using — clearing site
data or switching devices/browsers starts a fresh jar.
