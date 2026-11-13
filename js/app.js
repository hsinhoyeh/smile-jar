/* app.js — UI rendering & interactions for Smile Jar. */
(function () {
  const AVATARS = ["😊", "🐻", "🐱", "🐶", "🦊", "🐼", "🦁", "🐰", "🦄", "🐸", "🐵", "🐧"];
  const MAX_JAR_EMOJIS = 40;

  const $ = (id) => document.getElementById(id);

  let editingKidId = null; // null while the kid modal is in "add" mode
  let pickedAvatar = AVATARS[0];
  let objectiveRows = []; // [{title, cost}] while the kid modal is open
  let smileAmount = 1;
  let activeQuest = null; // which quest tab is showing on narrow screens
  let smileMode = "add"; // "add" | "remove" — which action the smile modal is doing

  /* ---------------------------------------------------------------- */
  /* Rendering                                                         */
  /* ---------------------------------------------------------------- */

  function renderKidTabs() {
    const kids = Store.getKids();
    const activeId = Store.getActiveKidId();
    const nav = $("kidTabs");
    nav.innerHTML = "";
    kids.forEach((kid) => {
      const btn = document.createElement("button");
      btn.className = "kid-tab" + (kid.id === activeId ? " active" : "");
      btn.innerHTML = `<span class="kid-tab-avatar">${kid.avatar}</span><span class="kid-tab-name"></span>`;
      btn.querySelector(".kid-tab-name").textContent = kid.name || "?";
      btn.addEventListener("click", () => {
        Store.setActiveKidId(kid.id);
        renderAll();
      });
      nav.appendChild(btn);
    });
    if (kids.length) {
      const addBtn = document.createElement("button");
      addBtn.className = "kid-tab kid-tab-add";
      addBtn.textContent = "+";
      addBtn.addEventListener("click", () => openKidModal(null));
      nav.appendChild(addBtn);
    }
  }

  function renderDashboard() {
    const kids = Store.getKids();
    const activeId = Store.getActiveKidId();
    const kid = kids.find((k) => k.id === activeId) || kids[0] || null;

    $("emptyState").classList.toggle("hidden", kids.length > 0);
    $("dashboard").classList.toggle("hidden", kids.length === 0);
    if (!kid) return;
    if (kid.id !== activeId) Store.setActiveKidId(kid.id);

    $("kidAvatarBig").textContent = kid.avatar;
    $("kidNameBig").textContent = kid.name;

    const goal = Store.goalFor(kid);
    const count = Store.currentCount(kid.id);
    const pct = Math.max(0, Math.min(100, Math.round((count / goal) * 100)));
    $("jarFill").style.height = pct + "%";
    $("jarProgressBar").style.width = pct + "%";
    I18N.setText($("jarCount"), I18N.t("smilesOfGoal", { count, goal }));
    $("jarTotalEver").textContent = Store.totalEver(kid.id);

    const emojiCount = Math.min(count, MAX_JAR_EMOJIS);
    $("jarEmojis").textContent = kid.avatar.repeat(emojiCount);

    renderObjectivesBreakdown(kid);
    renderQuests(kid);
    renderHistory(kid.id);
  }

  // Only worth showing when the goal is actually made of more than one
  // named item — a single-objective kid already sees the total in the jar.
  function renderObjectivesBreakdown(kid) {
    const show = kid.objectives.length > 1;
    $("objectivesBreakdown").classList.toggle("hidden", !show);
    if (!show) return;
    const list = $("objectivesBreakdownList");
    list.innerHTML = "";
    kid.objectives.forEach((o) => {
      const li = document.createElement("li");
      li.className = "objectives-breakdown-item";
      const titleSpan = document.createElement("span");
      titleSpan.textContent = o.title;
      const costSpan = document.createElement("span");
      costSpan.className = "objectives-breakdown-cost";
      costSpan.textContent = o.cost;
      li.appendChild(titleSpan);
      li.appendChild(costSpan);
      list.appendChild(li);
    });
  }

  function questTaskTitle(t) {
    return t.title || I18N.t("task_" + t.id);
  }
  function questTitle(q) {
    return I18N.t("quest" + q.charAt(0).toUpperCase() + q.slice(1) + "Title");
  }

  // Quests: tick tasks, then claim one smile per day inside the quest's time
  // window. Deliberately no celebration animation — keep it calm.
  function renderQuests(kid) {
    const wrap = $("quests");
    wrap.innerHTML = "";
    // Below 900px only one quest shows at a time, picked from these tabs
    // (CSS hides the tabs and shows every quest on wide screens).
    if (!Store.QUEST_IDS.includes(activeQuest)) activeQuest = Store.QUEST_IDS[0];
    const tabs = $("questTabs");
    tabs.innerHTML = "";
    Store.QUEST_IDS.forEach((q) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "quest-tab" + (q === activeQuest ? " active" : "");
      I18N.setText(tab, questTitle(q));
      tab.addEventListener("click", () => {
        activeQuest = q;
        renderQuests(kid);
      });
      tabs.appendChild(tab);
    });
    Store.QUEST_IDS.forEach((q) => {
      const tasks = Store.questTasksFor(kid, q);
      const today = Store.questToday(kid.id, q);
      const timed = Store.questIsTimed(q);
      const win = today.claimed ? "open" : Store.questWindow(kid, q);
      const cutoff = timed ? Store.questCutoffFor(kid, q) : "";
      const from = timed ? Store.questFromFor(kid, q) : "";

      const sec = document.createElement("section");
      sec.className = `quest quest-${q}` + (q === activeQuest ? "" : " quest-inactive");

      const h = document.createElement("h3");
      I18N.setText(h, questTitle(q));
      sec.appendChild(h);

      const ul = document.createElement("ul");
      ul.className = "quest-list";
      tasks.forEach((t) => {
        const li = document.createElement("li");
        const label = document.createElement("label");
        label.className = "quest-task";
        const box = document.createElement("input");
        box.type = "checkbox";
        box.checked = today.done.includes(t.id);
        box.disabled = today.claimed;
        box.addEventListener("change", () => {
          Store.toggleQuestTask(kid.id, q, t.id);
          renderAll();
        });
        const text = document.createElement("span");
        text.textContent = questTaskTitle(t);
        label.appendChild(box);
        label.appendChild(text);
        li.appendChild(label);
        ul.appendChild(li);
      });
      sec.appendChild(ul);

      const prog = document.createElement("div");
      prog.className = "quest-progress";
      I18N.setText(prog, I18N.t("questProgress", { done: today.done.length, total: tasks.length }));
      sec.appendChild(prog);

      if (today.claimed || win !== "open") {
        const msg = document.createElement("p");
        msg.className = "quest-status";
        const key = today.claimed ? "questClaimed_" + q : win === "early" ? "questEarly" : "questLate";
        I18N.setText(msg, I18N.t(key, { time: cutoff, from }));
        sec.appendChild(msg);
      } else {
        const btn = document.createElement("button");
        btn.className = "btn btn-primary";
        btn.disabled = today.done.length < tasks.length;
        I18N.setText(btn, I18N.t("questClaimBtn"));
        btn.addEventListener("click", () => claimQuestNow(q));
        sec.appendChild(btn);
      }

      if (Store.questHasStreak(q)) {
        const streak = Store.questStreak(kid.id, q);
        const badge = (n) =>
          `<span class="quest-badge${streak >= n ? " earned" : ""}">${I18N.markup(I18N.t(`questBadge${n}_${q}`))}</span>`;
        const st = document.createElement("div");
        st.className = "quest-streak";
        st.innerHTML = `<strong>${I18N.markup(I18N.t("questStreak_" + q, { n: streak }))}</strong> ` + badge(3) + badge(7);
        sec.appendChild(st);
      }

      const note = document.createElement("p");
      note.className = "muted quest-note";
      I18N.setText(note, timed ? I18N.t("questNote", { time: cutoff, from }) : I18N.t("questNoteFree"));
      sec.appendChild(note);

      wrap.appendChild(sec);
    });
  }

  function claimQuestNow(q) {
    const kidId = Store.getActiveKidId();
    const kid = Store.getKid(kidId);
    if (!kid) return;
    const goal = Store.goalFor(kid);
    const before = Store.currentCount(kidId);
    if (!Store.claimQuest(kidId, q, I18N.t("questReason_" + q))) return;
    const after = Store.currentCount(kidId);
    renderAll();
    if (before < goal && after >= goal) openCelebrate(kid);
  }

  function renderHistory(kidId) {
    const rewards = Store.rewardsForKid(kidId);
    const list = $("historyList");
    list.innerHTML = "";
    $("noHistory").classList.toggle("hidden", rewards.length > 0);

    const locale = I18N.lang === "zh-tw" ? "zh-TW" : "en-US";
    rewards.forEach((r) => {
      const isPunish = r.amount < 0;
      const li = document.createElement("li");
      li.className = "history-item" + (isPunish ? " history-item-punish" : "");
      const date = new Date(r.at).toLocaleString(locale, {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      });
      const reasonSpan = document.createElement("span");
      reasonSpan.className = "history-reason";
      reasonSpan.textContent = r.reason || (isPunish ? "😢" : "😊");
      const metaSpan = document.createElement("span");
      metaSpan.className = "history-meta";
      const sign = isPunish ? r.amount : `+${r.amount}`;
      metaSpan.textContent = `${sign} · ${date}`;
      const delBtn = document.createElement("button");
      delBtn.className = "icon-btn history-delete";
      delBtn.setAttribute("aria-label", "delete");
      delBtn.textContent = "×";
      delBtn.addEventListener("click", () => {
        if (confirm(I18N.t("deleteEntryConfirm"))) {
          Store.deleteReward(r.id);
          renderAll();
        }
      });
      const textWrap = document.createElement("div");
      textWrap.className = "history-text";
      textWrap.appendChild(reasonSpan);
      textWrap.appendChild(metaSpan);
      li.appendChild(textWrap);
      li.appendChild(delBtn);
      list.appendChild(li);
    });
  }

  function renderAll() {
    renderKidTabs();
    renderDashboard();
  }

  /* ---------------------------------------------------------------- */
  /* Kid modal (add / edit)                                            */
  /* ---------------------------------------------------------------- */

  function renderAvatarPicker() {
    const wrap = $("avatarPicker");
    wrap.innerHTML = "";
    AVATARS.forEach((a) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "avatar-option" + (a === pickedAvatar ? " selected" : "");
      btn.textContent = a;
      btn.addEventListener("click", () => {
        pickedAvatar = a;
        renderAvatarPicker();
      });
      wrap.appendChild(btn);
    });
  }

  function updateObjectiveTotal() {
    const total = objectiveRows.reduce((sum, o) => sum + (Number(o.cost) || 0), 0);
    I18N.setText($("objectiveTotal"), I18N.t("totalGoalLabel", { total }));
  }

  function renderObjectiveRows() {
    const wrap = $("objectiveRows");
    wrap.innerHTML = "";
    objectiveRows.forEach((row, i) => {
      const rowEl = document.createElement("div");
      rowEl.className = "objective-row";

      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.className = "objective-title";
      titleInput.maxLength = 60;
      titleInput.placeholder = I18N.t("objectiveTitlePlaceholder");
      titleInput.value = row.title;
      titleInput.addEventListener("input", () => { row.title = titleInput.value; });

      const costInput = document.createElement("input");
      costInput.type = "number";
      costInput.className = "objective-cost";
      costInput.min = "1";
      costInput.max = "9999";
      costInput.value = row.cost;
      costInput.addEventListener("input", () => {
        row.cost = costInput.value;
        updateObjectiveTotal();
      });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "icon-btn objective-remove" + (objectiveRows.length <= 1 ? " hidden" : "");
      removeBtn.setAttribute("aria-label", I18N.t("removeObjective"));
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => {
        objectiveRows.splice(i, 1);
        renderObjectiveRows();
      });

      rowEl.appendChild(titleInput);
      rowEl.appendChild(costInput);
      rowEl.appendChild(removeBtn);
      wrap.appendChild(rowEl);
    });
    updateObjectiveTotal();
  }

  // One block per quest: cutoff time + task list. Only custom titles are
  // shown; blank means "defaults", which keep following the language.
  function renderQuestEditFields(kid) {
    const wrap = $("questEditFields");
    wrap.innerHTML = "";
    Store.QUEST_IDS.forEach((q) => {
      // Collapsible so the modal stays short on phones.
      const block = document.createElement("details");
      block.className = "quest-edit";

      const title = document.createElement("summary");
      I18N.setText(title, questTitle(q));
      block.appendChild(title);

      const timeLabel = document.createElement("label");
      timeLabel.className = Store.questIsTimed(q) ? "field" : "hidden";
      const timeText = document.createElement("span");
      I18N.setText(timeText, I18N.t("questCutoffLabel"));
      const time = document.createElement("input");
      time.type = "time";
      time.id = `questCutoff_${q}`;
      time.value = kid ? Store.questCutoffFor(kid, q) : Store.questDefaultCutoff(q);
      timeLabel.appendChild(timeText);
      timeLabel.appendChild(time);

      const fromLabel = document.createElement("label");
      fromLabel.className = Store.questIsTimed(q) ? "field" : "hidden";
      const fromText = document.createElement("span");
      I18N.setText(fromText, I18N.t("questFromLabel"));
      const fromInput = document.createElement("input");
      fromInput.type = "time";
      fromInput.id = `questFrom_${q}`;
      fromInput.value = kid ? Store.questFromFor(kid, q) : Store.questDefaultFrom(q);
      fromLabel.appendChild(fromText);
      fromLabel.appendChild(fromInput);

      const times = document.createElement("div");
      times.className = "quest-times";
      times.appendChild(fromLabel);
      times.appendChild(timeLabel);
      block.appendChild(times);

      const hint = document.createElement("small");
      hint.className = "hint";
      I18N.setText(hint, I18N.t("questEditHint"));
      block.appendChild(hint);

      const ta = document.createElement("textarea");
      ta.id = `questTasks_${q}`;
      ta.rows = 5;
      const custom = kid && kid.quests && kid.quests[q] && kid.quests[q].tasks;
      ta.value = custom ? custom.map((t) => t.title).join("\n") : "";
      block.appendChild(ta);

      wrap.appendChild(block);
    });
  }

  function openKidModal(kid) {
    editingKidId = kid ? kid.id : null;
    pickedAvatar = kid ? kid.avatar : AVATARS[0];
    objectiveRows = kid
      ? kid.objectives.map((o) => ({ title: o.title, cost: o.cost }))
      : [{ title: "🎯", cost: Store.DEFAULT_GOAL }];
    $("kidNameInput").value = kid ? kid.name : "";
    I18N.setKey($("kidModalTitle"), kid ? "edit" : "addKid");
    $("deleteKidBtn").classList.toggle("hidden", !kid);
    renderQuestEditFields(kid);
    renderAvatarPicker();
    renderObjectiveRows();
    $("kidModal").classList.remove("hidden");
    $("kidNameInput").focus();
  }
  function closeKidModal() {
    $("kidModal").classList.add("hidden");
  }
  function saveKid() {
    const name = $("kidNameInput").value.trim();
    if (!name) { alert(I18N.t("nameRequired")); return; }
    const validObjectives = objectiveRows
      .map((o) => ({ title: (o.title || "").trim(), cost: Number(o.cost) }))
      .filter((o) => o.title && o.cost > 0);
    if (!validObjectives.length) { alert(I18N.t("objectivesRequired")); return; }
    const badWindow = Store.QUEST_IDS.some((q) => {
      const f = $(`questFrom_${q}`), c = $(`questCutoff_${q}`);
      return f && c && f.value && c.value && f.value >= c.value;
    });
    if (badWindow) { alert(I18N.t("questWindowInvalid")); return; }
    let savedKid;
    if (editingKidId) savedKid = Store.updateKid(editingKidId, { name, objectives: validObjectives, avatar: pickedAvatar });
    else savedKid = Store.addKid({ name, objectives: validObjectives, avatar: pickedAvatar });
    if (savedKid) {
      Store.QUEST_IDS.forEach((q) => {
        const titles = $(`questTasks_${q}`).value.split("\n").map((l) => l.trim()).filter(Boolean);
        Store.setQuestTasks(savedKid.id, q, titles);
        Store.setQuestCutoff(savedKid.id, q, $(`questCutoff_${q}`).value);
        Store.setQuestFrom(savedKid.id, q, $(`questFrom_${q}`).value);
      });
    }
    closeKidModal();
    renderAll();
  }
  function deleteKidNow() {
    if (!editingKidId) return;
    const kid = Store.getKid(editingKidId);
    if (!kid) return;
    if (confirm(I18N.t("confirmDeleteKid", { name: kid.name }))) {
      Store.deleteKid(editingKidId);
      closeKidModal();
      renderAll();
    }
  }

  /* ---------------------------------------------------------------- */
  /* Add-smile modal                                                   */
  /* ---------------------------------------------------------------- */

  function setAmount(n) {
    smileAmount = Math.max(1, Math.min(99, n));
    $("amountValue").textContent = smileAmount;
  }
  function openSmileModal(mode) {
    smileMode = mode;
    const isRemove = mode === "remove";
    I18N.setText($("smileModalTitle"), I18N.t(isRemove ? "removeSmileBtn" : "addSmileBtn"));
    I18N.setText($("reasonLabelText"), I18N.t(isRemove ? "removeReasonLabel" : "reasonLabel"));
    I18N.setText($("amountLabelText"), I18N.t(isRemove ? "removeAmountLabel" : "amountLabel"));
    $("reasonInput").placeholder = I18N.t(isRemove ? "removeReasonPlaceholder" : "reasonPlaceholder");
    $("smileSaveBtn").classList.toggle("btn-danger", isRemove);
    $("smileSaveBtn").classList.toggle("btn-primary", !isRemove);
    $("reasonInput").value = "";
    setAmount(1);
    $("smileModal").classList.remove("hidden");
    $("reasonInput").focus();
  }
  function closeSmileModal() {
    $("smileModal").classList.add("hidden");
  }
  function saveSmile() {
    const kidId = Store.getActiveKidId();
    const kid = Store.getKid(kidId);
    if (!kid) return;
    const reason = $("reasonInput").value.trim();
    if (!reason) { alert(I18N.t("reasonRequired")); return; }

    const goal = Store.goalFor(kid);
    const before = Store.currentCount(kidId);
    const signedAmount = smileMode === "remove" ? -smileAmount : smileAmount;
    Store.addReward(kidId, { amount: signedAmount, reason });
    const after = Store.currentCount(kidId);
    closeSmileModal();
    renderAll();

    if (before < goal && after >= goal) openCelebrate(kid);
  }

  /* ---------------------------------------------------------------- */
  /* Celebration                                                        */
  /* ---------------------------------------------------------------- */

  function openCelebrate(kid) {
    I18N.setText($("celebrateBody"), I18N.t("goalReachedBody", { name: kid.name, goal: Store.goalFor(kid) }));
    $("celebrateModal").classList.remove("hidden");
  }
  function closeCelebrate() {
    $("celebrateModal").classList.add("hidden");
  }
  function increaseGoalNow() {
    const kidId = Store.getActiveKidId();
    const kid = Store.getKid(kidId);
    if (!kid) return;
    const goal = Store.goalFor(kid);
    const bump = Math.max(10, Math.round(goal * 0.5));
    const objectives = kid.objectives.concat([{ title: I18N.t("bonusGoalTitle"), cost: bump }]);
    Store.updateKid(kidId, { objectives });
    closeCelebrate();
    renderAll();
  }
  function startNewJarNow() {
    const kidId = Store.getActiveKidId();
    if (!kidId) return;
    Store.startNewJar(kidId);
    closeCelebrate();
    renderAll();
  }

  /* ---------------------------------------------------------------- */
  /* Export / Import (backup & restore)                                */
  /* ---------------------------------------------------------------- */

  function exportBackup() {
    const payload = Store.exportData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smile-jar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importBackupFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let payload;
      try {
        payload = JSON.parse(reader.result);
      } catch (e) {
        alert(I18N.t("importError"));
        return;
      }
      if (!confirm(I18N.t("importConfirm"))) return;
      const result = Store.importData(payload);
      if (!result.ok) { alert(I18N.t("importError")); return; }
      renderAll();
      alert(I18N.t("importSuccess"));
    };
    reader.readAsText(file);
  }

  /* ---------------------------------------------------------------- */
  /* Wiring                                                             */
  /* ---------------------------------------------------------------- */

  function wire() {
    $("addFirstKidBtn").addEventListener("click", () => openKidModal(null));
    $("editKidBtn").addEventListener("click", () => openKidModal(Store.getKid(Store.getActiveKidId())));
    $("kidCancelBtn").addEventListener("click", closeKidModal);
    $("kidSaveBtn").addEventListener("click", saveKid);
    $("deleteKidBtn").addEventListener("click", deleteKidNow);
    $("addObjectiveBtn").addEventListener("click", () => {
      objectiveRows.push({ title: "", cost: "" });
      renderObjectiveRows();
    });
    $("kidModal").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeKidModal(); });

    $("addSmileBtn").addEventListener("click", () => openSmileModal("add"));
    $("removeSmileBtn").addEventListener("click", () => openSmileModal("remove"));
    $("smileCancelBtn").addEventListener("click", closeSmileModal);
    $("smileSaveBtn").addEventListener("click", saveSmile);
    $("amountMinus").addEventListener("click", () => setAmount(smileAmount - 1));
    $("amountPlus").addEventListener("click", () => setAmount(smileAmount + 1));
    $("smileModal").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeSmileModal(); });

    $("increaseGoalBtn").addEventListener("click", increaseGoalNow);
    $("startNewJarBtn").addEventListener("click", startNewJarNow);
    $("celebrateCloseBtn").addEventListener("click", closeCelebrate);
    $("celebrateModal").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeCelebrate(); });

    $("exportBtn").addEventListener("click", exportBackup);
    $("importBtn").addEventListener("click", () => $("importFileInput").click());
    $("importFileInput").addEventListener("change", (e) => {
      importBackupFile(e.target.files[0]);
      e.target.value = ""; // allow importing the same file again later
    });

    $("howToBtn").addEventListener("click", () => $("howToModal").classList.remove("hidden"));
    $("howToCloseBtn").addEventListener("click", () => $("howToModal").classList.add("hidden"));
    $("howToModal").addEventListener("click", (e) => { if (e.target === e.currentTarget) $("howToModal").classList.add("hidden"); });

    document.querySelectorAll(".lang-btn").forEach((b) => {
      b.addEventListener("click", () => I18N.setLang(b.dataset.lang));
    });
    I18N.onChange(renderAll);
  }

  document.addEventListener("DOMContentLoaded", () => {
    I18N.init();
    wire();
    renderAll();
  });
})();
