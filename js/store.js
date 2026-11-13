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
    const tasks = sanitizeBedtimeTasks(raw.bedtimeTasks);
    if (tasks) kid.bedtimeTasks = tasks;
    const cutoff = validCutoff(raw.bedtimeCutoff);
    if (cutoff) kid.bedtimeCutoff = cutoff;
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

  // Bedtime quest ("晚安任務"). Default tasks carry only an id; the UI looks up
  // a translated title by id until the family customises them.
  const DEFAULT_BEDTIME_TASKS = ["toys", "bath", "teeth", "story", "bed"].map((id) => ({ id }));
  const MAX_BEDTIME_TASKS = 10;
  const DEFAULT_BEDTIME_CUTOFF = "21:55"; // claim must happen before this (local time, HH:MM)

  function validCutoff(v) {
    return typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : undefined;
  }

  function sanitizeBedtimeTasks(list) {
    if (!Array.isArray(list)) return undefined;
    const clean = list
      .map((t) => ({ id: (t && t.id) || uid(), title: ((t && t.title) || "").toString().trim().slice(0, 40) }))
      .filter((t) => t.title)
      .slice(0, MAX_BEDTIME_TASKS);
    return clean.length ? clean : undefined;
  }
  function sanitizeBedtimeLog(raw, validKidIds) {
    if (!raw || typeof raw !== "object" || !validKidIds.has(raw.kidId)) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) return null;
    return {
      kidId: raw.kidId,
      date: raw.date,
      done: Array.isArray(raw.done) ? raw.done.filter((x) => typeof x === "string") : [],
      claimed: !!raw.claimed,
    };
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
        if (!Array.isArray(data.bedtime)) data.bedtime = [];
        if (migrated) save(data);
        return data;
      }
    } catch (e) {}
    return { kids: [], rewards: [], activeKidId: null, bedtime: [] };
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
      data.bedtime = data.bedtime.filter((b) => b.kidId !== id);
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

    /* ---- bedtime quest (晚安任務) ---- */
    // Tasks are [{id}] (defaults, title from i18n) or [{id, title}] (custom).
    bedtimeTasksFor(kid) {
      return kid.bedtimeTasks || DEFAULT_BEDTIME_TASKS;
    },
    // Pass an array of titles; an empty array restores the defaults.
    setBedtimeTasks(kidId, titles) {
      const data = load();
      const kid = data.kids.find((k) => k.id === kidId);
      if (!kid) return null;
      const tasks = sanitizeBedtimeTasks((titles || []).map((title) => ({ title })));
      if (tasks) kid.bedtimeTasks = tasks;
      else delete kid.bedtimeTasks;
      save(data);
      return kid;
    },
    bedtimeCutoffFor(kid) {
      return kid.bedtimeCutoff || DEFAULT_BEDTIME_CUTOFF;
    },
    // Invalid or empty input restores the default cutoff.
    setBedtimeCutoff(kidId, value) {
      const data = load();
      const kid = data.kids.find((k) => k.id === kidId);
      if (!kid) return null;
      const cutoff = validCutoff(value);
      if (cutoff && cutoff !== DEFAULT_BEDTIME_CUTOFF) kid.bedtimeCutoff = cutoff;
      else delete kid.bedtimeCutoff;
      save(data);
      return kid;
    },
    // True while the local clock is still at or before the kid's cutoff.
    beforeBedtimeCutoff(kid, now) {
      const d = now || new Date();
      const pad = (n) => String(n).padStart(2, "0");
      return `${pad(d.getHours())}:${pad(d.getMinutes())}` <= this.bedtimeCutoffFor(kid);
    },
    todayKey() {
      return dateKey(new Date());
    },
    // Tonight's progress for a kid: { done: [taskId], claimed }.
    bedtimeToday(kidId) {
      const data = load();
      const kid = data.kids.find((k) => k.id === kidId);
      const rec = data.bedtime.find((b) => b.kidId === kidId && b.date === this.todayKey());
      const valid = new Set(kid ? this.bedtimeTasksFor(kid).map((t) => t.id) : []);
      return {
        done: rec ? rec.done.filter((id) => valid.has(id)) : [],
        claimed: !!(rec && rec.claimed),
      };
    },
    toggleBedtimeTask(kidId, taskId) {
      const data = load();
      const date = this.todayKey();
      let rec = data.bedtime.find((b) => b.kidId === kidId && b.date === date);
      if (!rec) {
        rec = { kidId, date, done: [], claimed: false };
        data.bedtime.push(rec);
      }
      if (rec.claimed) return; // locked once tonight's smile is claimed
      const i = rec.done.indexOf(taskId);
      if (i >= 0) rec.done.splice(i, 1);
      else rec.done.push(taskId);
      save(data);
    },
    // Awards exactly one smile per kid per night, and only when every task
    // is ticked. Returns the reward, or null if not allowed.
    claimBedtime(kidId, reason) {
      const kid = this.getKid(kidId);
      if (!kid) return null;
      const today = this.bedtimeToday(kidId);
      if (today.claimed || today.done.length < this.bedtimeTasksFor(kid).length) return null;
      if (!this.beforeBedtimeCutoff(kid)) return null;
      const reward = this.addReward(kidId, { amount: 1, reason });
      const data = load();
      const rec = data.bedtime.find((b) => b.kidId === kidId && b.date === this.todayKey());
      if (rec) rec.claimed = true;
      save(data);
      return reward;
    },
    // Consecutive claimed nights ending tonight (or last night, if tonight
    // isn't claimed yet — so the streak doesn't vanish during the evening).
    bedtimeStreak(kidId) {
      const claimed = new Set(
        load().bedtime.filter((b) => b.kidId === kidId && b.claimed).map((b) => b.date)
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
        bedtime: data.bedtime,
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
      const bedtime = (Array.isArray(payload.bedtime) ? payload.bedtime : [])
        .map((b) => sanitizeBedtimeLog(b, kidIds))
        .filter(Boolean);
      save({ kids, rewards, bedtime, activeKidId });
      return { ok: true, kidCount: kids.length, rewardCount: rewards.length };
    },
  };

  window.Store = Store;
})();
