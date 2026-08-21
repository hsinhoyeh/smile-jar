/* app.js — UI rendering & interactions for Smile Jar. */
(function () {
  const AVATARS = ["😊", "🐻", "🐱", "🐶", "🦊", "🐼", "🦁", "🐰", "🦄", "🐸", "🐵", "🐧"];
  const MAX_JAR_EMOJIS = 40;

  const $ = (id) => document.getElementById(id);

  let editingKidId = null; // null while the kid modal is in "add" mode
  let pickedAvatar = AVATARS[0];
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

    const count = Store.currentCount(kid.id);
    const pct = Math.max(0, Math.min(100, Math.round((count / kid.goal) * 100)));
    $("jarFill").style.height = pct + "%";
    $("jarProgressBar").style.width = pct + "%";
    I18N.setText($("jarCount"), I18N.t("smilesOfGoal", { count, goal: kid.goal }));
    $("jarTotalEver").textContent = Store.totalEver(kid.id);

    const emojiCount = Math.min(count, MAX_JAR_EMOJIS);
    $("jarEmojis").textContent = kid.avatar.repeat(emojiCount);

    renderHistory(kid.id);
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

  function openKidModal(kid) {
    editingKidId = kid ? kid.id : null;
    pickedAvatar = kid ? kid.avatar : AVATARS[0];
    $("kidNameInput").value = kid ? kid.name : "";
    $("kidGoalInput").value = kid ? kid.goal : Store.DEFAULT_GOAL;
    I18N.setKey($("kidModalTitle"), kid ? "edit" : "addKid");
    $("deleteKidBtn").classList.toggle("hidden", !kid);
    renderAvatarPicker();
    $("kidModal").classList.remove("hidden");
    $("kidNameInput").focus();
  }
  function closeKidModal() {
    $("kidModal").classList.add("hidden");
  }
  function saveKid() {
    const name = $("kidNameInput").value.trim();
    if (!name) { alert(I18N.t("nameRequired")); return; }
    const goal = Number($("kidGoalInput").value) || Store.DEFAULT_GOAL;
    if (editingKidId) Store.updateKid(editingKidId, { name, goal, avatar: pickedAvatar });
    else Store.addKid({ name, goal, avatar: pickedAvatar });
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

    const before = Store.currentCount(kidId);
    const signedAmount = smileMode === "remove" ? -smileAmount : smileAmount;
    Store.addReward(kidId, { amount: signedAmount, reason });
    const after = Store.currentCount(kidId);
    closeSmileModal();
    renderAll();

    if (before < kid.goal && after >= kid.goal) openCelebrate(kid);
  }

  /* ---------------------------------------------------------------- */
  /* Celebration                                                        */
  /* ---------------------------------------------------------------- */

  function openCelebrate(kid) {
    I18N.setText($("celebrateBody"), I18N.t("goalReachedBody", { name: kid.name, goal: kid.goal }));
    $("celebrateModal").classList.remove("hidden");
  }
  function closeCelebrate() {
    $("celebrateModal").classList.add("hidden");
  }
  function increaseGoalNow() {
    const kidId = Store.getActiveKidId();
    const kid = Store.getKid(kidId);
    if (!kid) return;
    const bump = Math.max(10, Math.round(kid.goal * 0.5));
    Store.updateKid(kidId, { goal: kid.goal + bump });
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
