/* app.js — UI rendering & interactions for Smile Jar. */
(function () {
  const AVATARS = ["😊", "🐻", "🐱", "🐶", "🦊", "🐼", "🦁", "🐰", "🦄", "🐸", "🐵", "🐧"];
  const MAX_JAR_EMOJIS = 40;

  const $ = (id) => document.getElementById(id);

  let editingKidId = null; // null while the kid modal is in "add" mode
  let pickedAvatar = AVATARS[0];
  let objectiveRows = []; // [{title, cost}] while the kid modal is open
  let smileAmount = 1;
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
    renderBedtime(kid);
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

  function bedtimeTaskTitle(t) {
    return t.title || I18N.t("task_" + t.id);
  }

  // Bedtime quest: tick tasks, then claim one smile per night. Deliberately
  // no celebration animation — the evening should wind down, not wind up.
  function renderBedtime(kid) {
    const tasks = Store.bedtimeTasksFor(kid);
    const today = Store.bedtimeToday(kid.id);
    const list = $("bedtimeList");
    list.innerHTML = "";
    tasks.forEach((t) => {
      const li = document.createElement("li");
      const label = document.createElement("label");
      label.className = "bedtime-task";
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = today.done.includes(t.id);
      box.disabled = today.claimed;
      box.addEventListener("change", () => {
        Store.toggleBedtimeTask(kid.id, t.id);
        renderAll();
      });
      const text = document.createElement("span");
      text.textContent = bedtimeTaskTitle(t);
      label.appendChild(box);
      label.appendChild(text);
      li.appendChild(label);
      list.appendChild(li);
    });

    I18N.setText($("bedtimeProgress"), I18N.t("bedtimeProgress", { done: today.done.length, total: tasks.length }));
    const cutoff = Store.bedtimeCutoffFor(kid);
    const late = !today.claimed && !Store.beforeBedtimeCutoff(kid);
    const ready = !today.claimed && !late && today.done.length >= tasks.length;
    $("bedtimeClaimBtn").classList.toggle("hidden", today.claimed || late);
    $("bedtimeClaimBtn").disabled = !ready;
    $("bedtimePast").classList.toggle("hidden", !late);
    I18N.setText($("bedtimePast"), I18N.t("bedtimePastCutoff", { time: cutoff }));
    I18N.setText($("bedtimeNote"), I18N.t("bedtimeNote", { time: cutoff }));
    $("bedtimeClaimed").classList.toggle("hidden", !today.claimed);
    I18N.setText($("bedtimeClaimed"), I18N.t("bedtimeClaimed"));

    const streak = Store.bedtimeStreak(kid.id);
    const badge = (n, key) => `<span class="bedtime-badge${streak >= n ? " earned" : ""}">${I18N.markup(I18N.t(key))}</span>`;
    $("bedtimeStreak").innerHTML =
      `<strong>${I18N.markup(I18N.t("bedtimeStreak", { n: streak }))}</strong> ` +
      badge(3, "bedtimeBadge3") + badge(7, "bedtimeBadge7");
  }

  function claimBedtimeNow() {
    const kidId = Store.getActiveKidId();
    const kid = Store.getKid(kidId);
    if (!kid) return;
    const goal = Store.goalFor(kid);
    const before = Store.currentCount(kidId);
    if (!Store.claimBedtime(kidId, I18N.t("bedtimeClaimReason"))) return;
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

  function openKidModal(kid) {
    editingKidId = kid ? kid.id : null;
    pickedAvatar = kid ? kid.avatar : AVATARS[0];
    objectiveRows = kid
      ? kid.objectives.map((o) => ({ title: o.title, cost: o.cost }))
      : [{ title: "🎯", cost: Store.DEFAULT_GOAL }];
    $("kidNameInput").value = kid ? kid.name : "";
    I18N.setKey($("kidModalTitle"), kid ? "edit" : "addKid");
    $("deleteKidBtn").classList.toggle("hidden", !kid);
    // Show only custom titles; defaults stay blank so they keep following the language.
    $("bedtimeCutoffInput").value = kid ? Store.bedtimeCutoffFor(kid) : "21:55";
    $("bedtimeTasksInput").value = kid && kid.bedtimeTasks ? kid.bedtimeTasks.map((t) => t.title).join("\n") : "";
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
    const taskTitles = $("bedtimeTasksInput").value.split("\n").map((l) => l.trim()).filter(Boolean);
    let savedKid;
    if (editingKidId) savedKid = Store.updateKid(editingKidId, { name, objectives: validObjectives, avatar: pickedAvatar });
    else savedKid = Store.addKid({ name, objectives: validObjectives, avatar: pickedAvatar });
    if (savedKid) {
      Store.setBedtimeTasks(savedKid.id, taskTitles);
      Store.setBedtimeCutoff(savedKid.id, $("bedtimeCutoffInput").value);
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

    $("bedtimeClaimBtn").addEventListener("click", claimBedtimeNow);
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
