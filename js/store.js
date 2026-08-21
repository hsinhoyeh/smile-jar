/* store.js — local (per-device) kids, goals & smile rewards via localStorage.
   No accounts, no network — kid-safe by default. */
(function () {
  const KEY_DATA = "smj_data"; // { kids: [...], rewards: [...], activeKidId }
  const DEFAULT_GOAL = 99;

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY_DATA));
      if (data && Array.isArray(data.kids) && Array.isArray(data.rewards)) return data;
    } catch (e) {}
    return { kids: [], rewards: [], activeKidId: null };
  }
  function save(data) {
    localStorage.setItem(KEY_DATA, JSON.stringify(data));
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
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
    addKid({ name, goal, avatar }) {
      const data = load();
      const now = Date.now();
      const kid = {
        id: uid(),
        name: (name || "").trim().slice(0, 24),
        goal: Math.max(1, Number(goal) || DEFAULT_GOAL),
        avatar: avatar || "😊",
        cycleStart: now,
        createdAt: now,
      };
      data.kids.push(kid);
      data.activeKidId = kid.id;
      save(data);
      return kid;
    },
    updateKid(id, { name, goal, avatar }) {
      const data = load();
      const kid = data.kids.find((k) => k.id === id);
      if (!kid) return null;
      if (name !== undefined) kid.name = (name || "").trim().slice(0, 24);
      if (goal !== undefined) kid.goal = Math.max(1, Number(goal) || DEFAULT_GOAL);
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
    // Start a fresh jar toward the same (or a new) goal; history is kept.
    startNewJar(kidId, newGoal) {
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
      if (newGoal !== undefined) kid.goal = Math.max(1, Number(newGoal) || DEFAULT_GOAL);
      save(data);
      return kid;
    },
  };

  window.Store = Store;
})();
