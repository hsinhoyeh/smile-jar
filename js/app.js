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
    if (editingKidId) Store.updateKid(editingKidId, { name, objectives: validObjectives, avatar: pickedAvatar });
    else Store.addKid({ name, objectives: validObjectives, avatar: pickedAvatar });
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
