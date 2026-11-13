/* store.js — local (per-device) kids, goals & smile rewards via localStorage.
   No accounts, no network — kid-safe by default. */
(function () {
  const KEY_DATA = "smj_data"; // { kids: [...], rewards: [...], activeKidId }
  const DEFAULT_GOAL = 99;

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // A kid's goal is the total of one or more named objectives (e.g. "Trip to
  // the electronics store: 50" + "Buy a lightbulb: 7" = 57). Drops empty
  // rows, clamps each cost, and falls back to a single default objective if
  // nothing valid is left.
  function sanitizeObjectives(list) {
    const clean = (Array.isArray(list) ? list : [])
      .map((o) => ({
        id: o.id || uid(),
        title: (o.title || "").trim().slice(0, 60),
        cost: Math.max(1, Math.min(9999, Math.round(Number(o.cost)) || 0)),
      }))
      .filter((o) => o.title && o.cost > 0);
    return clean.length ? clean : [{ id: uid(), title: "🎯", cost: DEFAULT_GOAL }];
  }

  // Rebuild a kid from an imported (possibly hand-edited) backup, the same
  // way addKid() would build one from form input.
  function sanitizeKid(raw) {
    if (!raw || typeof raw !== "object") return null;
    const kid = {
      id: typeof raw.id === "string" && raw.id ? raw.id : uid(),
      name: (raw.name || "").toString().trim().slice(0, 24),
      objectives: sanitizeObjectives(raw.objectives),
      avatar: (raw.avatar || "😊").toString(),
      cycleStart: Number(raw.cycleStart) || Date.now(),
      createdAt: Number(raw.createdAt) || Date.now(),
    };
    // Accept backups from before quests were generalised.
    const shaped = { bedtimeTasks: raw.bedtimeTasks, bedtimeCutoff: raw.bedtimeCutoff, quests: raw.quests };
    migrateLegacyQuests(shaped);
    const quests = sanitizeKidQuests(shaped.quests);
    if (Object.keys(quests).length) kid.quests = quests;
    return kid;
  }
  // Drops rewards pointing at a kid that didn't survive sanitizeKid().
  function sanitizeReward(raw, validKidIds) {
    if (!raw || typeof raw !== "object" || !validKidIds.has(raw.kidId)) return null;
    const amount = Math.round(Number(raw.amount));
    if (!amount) return null;
    const magnitude = Math.max(1, Math.min(99, Math.abs(amount)));
    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : uid(),
      kidId: raw.kidId,
      amount: amount < 0 ? -magnitude : magnitude,
      reason: (raw.reason || "").toString().trim().slice(0, 140),
      at: Number(raw.at) || Date.now(),
    };
  }

  // Quests are named daily checklists (晚安任務, 上學任務, ...). Each earns
  // one smile per kid per day, only inside its time window. Default tasks
  // carry just an id; the UI looks up a translated title until the family
  // customises them. `from`/`cutoff` are local HH:MM.
  const QUESTS = {
    bedtime: { from: "17:00", cutoff: "21:55", tasks: ["toys", "bath", "teeth", "toilet", "bed"] },
    school: { from: "05:00", cutoff: "08:00", tasks: ["wake", "wash", "dress", "breakfast", "bag"] },
    // Outings have no time of day, so no window and no streak.
    outing: { timed: false, streak: false, tasks: ["pack", "summary", "calm"] },
  };
  const isTimed = (q) => QUESTS[q].timed !== false;
  const QUEST_IDS = Object.keys(QUESTS);
  const MAX_QUEST_TASKS = 10;

  function defaultTasks(q) {
    return QUESTS[q].tasks.map((id) => ({ id }));
  }
  function validCutoff(v) {
    return typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : undefined;
  }
  function sanitizeQuestTasks(list) {
    if (!Array.isArray(list)) return undefined;
    const clean = list
      .map((t) => ({ id: (t && t.id) || uid(), title: ((t && t.title) || "").toString().trim().slice(0, 40) }))
      .filter((t) => t.title)
      .slice(0, MAX_QUEST_TASKS);
    return clean.length ? clean : undefined;
  }
  // kid.quests = { bedtime: { tasks?, cutoff? }, school: {...} } — only
  // customised values are stored; everything else follows the defaults.
  function sanitizeKidQuests(raw) {
    const out = {};
    QUEST_IDS.forEach((q) => {
      const r = raw && raw[q];
      if (!r || typeof r !== "object") return;
      const entry = {};
      const tasks = sanitizeQuestTasks(r.tasks);
      if (tasks) entry.tasks = tasks;
      const cutoff = validCutoff(r.cutoff);
      if (cutoff && isTimed(q) && cutoff !== QUESTS[q].cutoff) entry.cutoff = cutoff;
      if (Object.keys(entry).length) out[q] = entry;
    });
    return out;
  }
  function sanitizeQuestLog(raw, validKidIds) {
    if (!raw || typeof raw !== "object" || !validKidIds.has(raw.kidId)) return null;
    if (!QUESTS[raw.quest] || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) return null;
    return {
      kidId: raw.kidId,
      quest: raw.quest,
      date: raw.date,
      done: Array.isArray(raw.done) ? raw.done.filter((x) => typeof x === "string") : [],
      claimed: !!raw.claimed,
    };
  }
  // Older data kept a single bedtime quest in kid.bedtimeTasks/bedtimeCutoff
  // and a top-level `bedtime` log — fold both into the generic shape.
  function migrateLegacyQuests(kid) {
    if (kid.bedtimeTasks === undefined && kid.bedtimeCutoff === undefined) return false;
    const legacy = { bedtime: { tasks: kid.bedtimeTasks, cutoff: kid.bedtimeCutoff } };
    kid.quests = Object.assign(sanitizeKidQuests(legacy), kid.quests || {});
    delete kid.bedtimeTasks;
    delete kid.bedtimeCutoff;
    return true;
  }
  function dateKey(d) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY_DATA));
      if (data && Array.isArray(data.kids) && Array.isArray(data.rewards)) {
        let migrated = false;
        data.kids.forEach((kid) => {
          // Legacy kids only had a flat `goal` number — fold it into a
          // single objective so `goalFor()` is the only source of truth.
          if (!Array.isArray(kid.objectives)) {
            kid.objectives = [{ id: uid(), title: "🎯", cost: kid.goal || DEFAULT_GOAL }];
            delete kid.goal;
            migrated = true;
          }
        });
        data.kids.forEach((kid) => { if (migrateLegacyQuests(kid)) migrated = true; });
        if (!Array.isArray(data.quests)) {
          data.quests = (Array.isArray(data.bedtime) ? data.bedtime : []).map((b) => Object.assign({ quest: "bedtime" }, b));
          delete data.bedtime;
          migrated = true;
        }
        if (migrated) save(data);
        return data;
      }
    } catch (e) {}
    return { kids: [], rewards: [], activeKidId: null, quests: [] };
  }
  function save(data) {
    localStorage.setItem(KEY_DATA, JSON.stringify(data));
  }

  const Store = {
    DEFAULT_GOAL,

    /* ---- kids ---- */
    getKids() {
      return load().kids;
    },
    getKid(id) {
      return load().kids.find((k) => k.id === id) || null;
    },
    // Total smiles needed — the sum of every objective's cost.
    goalFor(kid) {
      return kid.objectives.reduce((sum, o) => sum + o.cost, 0);
    },
    addKid({ name, objectives, avatar }) {
      const data = load();
      const now = Date.now();
      const kid = {
        id: uid(),
        name: (name || "").trim().slice(0, 24),
        objectives: sanitizeObjectives(objectives),
        avatar: avatar || "😊",
        cycleStart: now,
        createdAt: now,
      };
      data.kids.push(kid);
      data.activeKidId = kid.id;
      save(data);
      return kid;
    },
    updateKid(id, { name, objectives, avatar }) {
      const data = load();
      const kid = data.kids.find((k) => k.id === id);
      if (!kid) return null;
      if (name !== undefined) kid.name = (name || "").trim().slice(0, 24);
      if (objectives !== undefined) kid.objectives = sanitizeObjectives(objectives);
      if (avatar !== undefined) kid.avatar = avatar;
      save(data);
      return kid;
    },
    deleteKid(id) {
      const data = load();
      data.kids = data.kids.filter((k) => k.id !== id);
      data.rewards = data.rewards.filter((r) => r.kidId !== id);
      data.quests = data.quests.filter((b) => b.kidId !== id);
      if (data.activeKidId === id) data.activeKidId = (data.kids[0] && data.kids[0].id) || null;
      save(data);
    },

    /* ---- active kid (which tab is selected) ---- */
    getActiveKidId() {
      return load().activeKidId;
    },
    setActiveKidId(id) {
      const data = load();
      data.activeKidId = id;
      save(data);
    },

    /* ---- rewards (smiles) ---- */
    addReward(kidId, { amount, reason }) {
      const data = load();
      const signed = Number(amount) || 1;
      const magnitude = Math.max(1, Math.min(99, Math.abs(signed)));
      const reward = {
        id: uid(),
        kidId,
        // Positive = smile earned, negative = smile removed (a punishment).
        amount: signed < 0 ? -magnitude : magnitude,
        reason: (reason || "").trim().slice(0, 140),
        at: Date.now(),
      };
      data.rewards.push(reward);
      save(data);
      return reward;
    },
    deleteReward(id) {
      const data = load();
      data.rewards = data.rewards.filter((r) => r.id !== id);
      save(data);
    },
    // Full history, newest first.
    rewardsForKid(kidId) {
      return load()
        .rewards.filter((r) => r.kidId === kidId)
        .sort((a, b) => b.at - a.at);
    },

    /* ---- jar progress ---- */
    // Smiles counted toward the CURRENT jar (since the last reset/new-jar).
    // Punishments can pull this down, but the jar never shows below empty.
    currentCount(kidId) {
      const kid = this.getKid(kidId);
      if (!kid) return 0;
      const sum = load()
        .rewards.filter((r) => r.kidId === kidId && r.at >= kid.cycleStart)
        .reduce((sum, r) => sum + r.amount, 0);
      return Math.max(0, sum);
    },
    // Lifetime total, across every jar this kid has ever filled.
    totalEver(kidId) {
      const sum = load()
        .rewards.filter((r) => r.kidId === kidId)
        .reduce((sum, r) => sum + r.amount, 0);
      return Math.max(0, sum);
    },
    // Start a fresh jar toward the same (or a new) set of objectives; history is kept.
    startNewJar(kidId, newObjectives) {
      const data = load();
      const kid = data.kids.find((k) => k.id === kidId);
      if (!kid) return null;
      // Guard against the reward that just hit the goal sharing this exact
      // millisecond — currentCount() is inclusive of cycleStart, so the new
      // cycle must start strictly after every reward already recorded.
      const lastRewardAt = data.rewards
        .filter((r) => r.kidId === kidId)
        .reduce((max, r) => Math.max(max, r.at), 0);
      kid.cycleStart = Math.max(Date.now(), lastRewardAt + 1);
      if (newObjectives !== undefined) kid.objectives = sanitizeObjectives(newObjectives);
      save(data);
      return kid;
    },

    /* ---- quests (晚安任務, 上學任務, ...) ---- */
    QUEST_IDS,
    // Tasks are [{id}] (defaults, title from i18n) or [{id, title}] (custom).
    questTasksFor(kid, q) {
      return (kid.quests && kid.quests[q] && kid.quests[q].tasks) || defaultTasks(q);
    },
    // Pass an array of titles; an empty array restores the defaults.
    setQuestTasks(kidId, q, titles) {
      const data = load();
      const kid = data.kids.find((k) => k.id === kidId);
      if (!kid || !QUESTS[q]) return null;
      const tasks = sanitizeQuestTasks((titles || []).map((title) => ({ title })));
      kid.quests = kid.quests || {};
      kid.quests[q] = kid.quests[q] || {};
      if (tasks) kid.quests[q].tasks = tasks;
      else delete kid.quests[q].tasks;
      if (!Object.keys(kid.quests[q]).length) delete kid.quests[q];
      save(data);
      return kid;
    },
    questCutoffFor(kid, q) {
      return (kid.quests && kid.quests[q] && kid.quests[q].cutoff) || QUESTS[q].cutoff;
    },
    questFromFor(q) {
      return QUESTS[q].from;
    },
    questIsTimed: isTimed,
    questHasStreak(q) {
      return QUESTS[q].streak !== false;
    },
    questDefaultCutoff(q) {
      return QUESTS[q].cutoff;
    },
    // Invalid or empty input restores the default cutoff.
    setQuestCutoff(kidId, q, value) {
      const data = load();
      const kid = data.kids.find((k) => k.id === kidId);
      if (!kid || !QUESTS[q]) return null;
      const cutoff = isTimed(q) ? validCutoff(value) : undefined;
      kid.quests = kid.quests || {};
      kid.quests[q] = kid.quests[q] || {};
      if (cutoff && cutoff !== QUESTS[q].cutoff) kid.quests[q].cutoff = cutoff;
      else delete kid.quests[q].cutoff;
      if (!Object.keys(kid.quests[q]).length) delete kid.quests[q];
      save(data);
      return kid;
    },
    // "open" (claimable now), "early" (before the window opens) or "late".
    questWindow(kid, q, now) {
      if (!isTimed(q)) return "open";
      const d = now || new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const t = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      if (t < QUESTS[q].from) return "early";
      return t <= this.questCutoffFor(kid, q) ? "open" : "late";
    },
    todayKey() {
      return dateKey(new Date());
    },
    // Today's progress: { done: [taskId], claimed }.
    questToday(kidId, q) {
      const data = load();
      const kid = data.kids.find((k) => k.id === kidId);
      const rec = data.quests.find((b) => b.kidId === kidId && b.quest === q && b.date === this.todayKey());
      const valid = new Set(kid ? this.questTasksFor(kid, q).map((t) => t.id) : []);
      return {
        done: rec ? rec.done.filter((id) => valid.has(id)) : [],
        claimed: !!(rec && rec.claimed),
      };
    },
    toggleQuestTask(kidId, q, taskId) {
      const data = load();
      const date = this.todayKey();
      let rec = data.quests.find((b) => b.kidId === kidId && b.quest === q && b.date === date);
      if (!rec) {
        rec = { kidId, quest: q, date, done: [], claimed: false };
        data.quests.push(rec);
      }
      if (rec.claimed) return; // locked once today's smile is claimed
      const i = rec.done.indexOf(taskId);
      if (i >= 0) rec.done.splice(i, 1);
      else rec.done.push(taskId);
      save(data);
    },
    // One smile per kid per quest per day, only when every task is ticked
    // and the clock is inside the quest's window. Returns the reward or null.
    claimQuest(kidId, q, reason) {
      const kid = this.getKid(kidId);
      if (!kid || !QUESTS[q]) return null;
      const today = this.questToday(kidId, q);
      if (today.claimed || today.done.length < this.questTasksFor(kid, q).length) return null;
      if (this.questWindow(kid, q) !== "open") return null;
      const reward = this.addReward(kidId, { amount: 1, reason });
      const data = load();
      const rec = data.quests.find((b) => b.kidId === kidId && b.quest === q && b.date === this.todayKey());
      if (rec) rec.claimed = true;
      save(data);
      return reward;
    },
    // Consecutive claimed days ending today (or yesterday, if today isn't
    // claimed yet — so the streak doesn't vanish before the day's claim).
    questStreak(kidId, q) {
      const claimed = new Set(
        load().quests.filter((b) => b.kidId === kidId && b.quest === q && b.claimed).map((b) => b.date)
      );
      const d = new Date();
      if (!claimed.has(dateKey(d))) d.setDate(d.getDate() - 1);
      let streak = 0;
      while (claimed.has(dateKey(d))) {
        streak++;
        d.setDate(d.getDate() - 1);
      }
      return streak;
    },

    /* ---- export / import (backup & restore) ---- */
    // Everything needed to restore the jar elsewhere: kids, full reward
    // history, and which tab was active.
    exportData() {
      const data = load();
      return {
        app: "smile-jar",
        version: 1,
        exportedAt: Date.now(),
        kids: data.kids,
        rewards: data.rewards,
        quests: data.quests,
        activeKidId: data.activeKidId,
      };
    },
    // Replaces ALL local data with a previously exported backup. Re-sanitizes
    // every field so a hand-edited or older-format file can't corrupt the
    // app. Returns { ok } or { ok: false, error }.
    importData(payload) {
      if (!payload || typeof payload !== "object" || !Array.isArray(payload.kids) || !Array.isArray(payload.rewards)) {
        return { ok: false, error: "invalid" };
      }
      const kids = payload.kids.map(sanitizeKid).filter(Boolean);
      const kidIds = new Set(kids.map((k) => k.id));
      const rewards = payload.rewards
        .map((r) => sanitizeReward(r, kidIds))
        .filter(Boolean);
      const activeKidId = kidIds.has(payload.activeKidId) ? payload.activeKidId : (kids[0] ? kids[0].id : null);
      // `bedtime` is the pre-quests name for the log; its entries lack `quest`.
      const rawLog = Array.isArray(payload.quests)
        ? payload.quests
        : (Array.isArray(payload.bedtime) ? payload.bedtime : []).map((b) => Object.assign({ quest: "bedtime" }, b));
      const quests = rawLog.map((b) => sanitizeQuestLog(b, kidIds)).filter(Boolean);
      save({ kids, rewards, quests, activeKidId });
      return { ok: true, kidCount: kids.length, rewardCount: rewards.length };
    },
  };

  window.Store = Store;
})();
