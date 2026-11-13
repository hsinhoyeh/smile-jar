# 😊 Smile Jar

A tiny **daily-smile reward tracker** for families. Set a goal — or several —
record a reason every time your kid earns (or loses) a smile, and watch the
jar fill up.

Bilingual out of the box: **English** + **繁體中文 (zh-TW)** with 注音 (zhuyin /
bopomofo) annotations on every Chinese character. 100% static — no build
step, no backend, **no login** — everything stays on your device
(`localStorage`). Deploys straight to **GitHub Pages**.

> 笑臉罐 — 給家庭用的每日笑臉獎勵紀錄工具。設定一個或多個目標、寫下每一次獲
> 得或扣除笑臉的原因，看著罐子慢慢裝滿。純靜態網頁，不需要登入，資料只存在
> 你的裝置上。

**Live site:** https://hsinhoyeh.github.io/smile-jar/

---

## ✨ Features

- **Multiple kids**, each with their own goal and a pick-your-own emoji
  avatar.
- **Multi-objective goals** — a goal can be made of several named items
  whose smile costs add up to the total, e.g. *Trip to the electronics
  store: 50* + *Buy a lightbulb: 7* = **57 smiles**. A single flat goal
  (e.g. 99) works too — it's just a goal with one item.
- **Record a smile** with a required reason — a running log of what earned
  it, not just a number.
- **Remove a smile** for a rule broken, also with a required reason. Both
  live in the same honest history log; the jar just never shows below empty.
- **Quests (任務)** — named daily checklists per kid, each earning **one** 😊
  per day into the same jar once every task is ticked:
  - 🌙 **Bedtime (晚安任務)** — tidy toys, bath, brush teeth, go to the toilet,
    in bed on time. Claimable 17:00 – 21:55.
  - 🎒 **School (上學任務)** — wake up, wash up, get dressed, breakfast, pack
    bag. Claimable 05:00 – 08:00.
  - 🚗 **Outing (出門任務)** — pack own snack & water bottle, tell a summary of
    where you went, stay calm the whole time. No time window.

  The claim cutoff (timed quests) and the task list are editable per kid. A
  missed day just means no smile — nothing is deducted. Timed quests track a
  consecutive-day streak with 3- and 7-day milestones. Quest progress is
  included in export/import (older backups still import).
- **Jar dashboard** — a fill-up jar + progress bar showing how close each
  kid is to their goal, a goal breakdown when there's more than one
  objective, and a lifetime total.
- **Goal reached** celebration, with the option to raise the goal (adds a
  bonus objective) or start a fresh jar (history is always kept).
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
