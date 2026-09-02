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
    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : uid(),
      name: (raw.name || "").toString().trim().slice(0, 24),
      objectives: sanitizeObjectives(raw.objectives),
      avatar: (raw.avatar || "😊").toString(),
      cycleStart: Number(raw.cycleStart) || Date.now(),
      createdAt: Number(raw.createdAt) || Date.now(),
    };
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
        if (migrated) save(data);
        return data;
      }
    } catch (e) {}
    return { kids: [], rewards: [], activeKidId: null };
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
      save({ kids, rewards, activeKidId });
      return { ok: true, kidCount: kids.length, rewardCount: rewards.length };
    },
  };

  window.Store = Store;
})();
