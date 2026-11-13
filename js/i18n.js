/* i18n.js — bilingual strings (English + 繁體中文) and helpers.
   Same pattern as code-quest-kids: I18N.t(key) + I18N.setKey(el, key), with
   zh-TW text auto-annotated with zhuyin via window.ZH. */
(function () {
  const STRINGS = {
    en: {
      appTitle: "Smile Jar",
      tagline: "Collect smiles, reach your goal!",
      exportBtn: "⬇️ Export",
      importBtn: "⬆️ Import",
      importConfirm: "Importing will replace all current kids and smile history with this backup file. Continue?",
      importSuccess: "Backup imported successfully!",
      importError: "Couldn't read that file — please pick a valid Smile Jar backup (.json).",
      howTo: "How it works",
      gotIt: "Got it!",
      howto1: "Whenever your kid does something great, tap 😊 Add a Smile and write why.",
      howto2: "Watch the jar fill up as smiles add up toward the goal.",
      howto3: "Reach the goal to celebrate — then start a new jar or raise the goal!",

      addKid: "+ Add Kid",
      addFirstKid: "+ Add your first kid",
      noKidsTitle: "No kids yet",
      noKids: "Add a kid to start collecting smiles!",

      nameLabel: "Name",
      namePlaceholder: "e.g. Mia",
      goalLabel: "Goal",
      goalHint: "Add one or more things they're earning smiles for — the goal is the total.",
      objectiveTitlePlaceholder: "e.g. Trip to the electronics store",
      addObjective: "+ Add another goal",
      removeObjective: "Remove this goal",
      totalGoalLabel: "Total: {total} smiles",
      objectivesRequired: "Add at least one goal with a name and a smile amount",
      goalBreakdown: "Goal breakdown",
      bonusGoalTitle: "🎁 Bonus goal",
      avatarLabel: "Pick an icon",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      deleteKid: "Delete Kid",
      confirmDeleteKid: "Delete {name} and all their smiles? This can't be undone.",

      smilesOfGoal: "{count} of {goal} smiles",
      totalEver: "Total ever",
      addSmileBtn: "😊 Add a Smile",
      reasonLabel: "What did they do?",
      reasonPlaceholder: "e.g. Shared toys with sister",
      amountLabel: "How many smiles?",
      removeSmileBtn: "➖ Remove Smiles",
      removeReasonLabel: "What happened?",
      removeReasonPlaceholder: "e.g. Didn't listen at bedtime",
      removeAmountLabel: "How many to remove?",
      nameRequired: "Please enter a name",
      reasonRequired: "Please write a reason",

      history: "Recent Smiles",
      noHistory: "No smiles recorded yet — add the first one!",
      deleteEntryConfirm: "Delete this smile?",

      goalReachedTitle: "Goal Reached! 🎉",
      goalReachedBody: "{name} collected {goal} smiles! Amazing work!",
      increaseGoal: "Increase Goal",
      startNewJar: "Start a New Jar",
      close: "Close",

      bedtimeTitle: "🌙 Bedtime Quest",
      bedtimeProgress: "{done} / {total} tasks done",
      bedtimeClaimBtn: "Claim 1 smile 😊",
      bedtimeClaimed: "Tonight's smile is claimed. Sweet dreams! 🌙",
      bedtimeClaimReason: "🌙 Finished the bedtime quest",
      bedtimeStreak: "{n}-night streak",
      bedtimeBadge3: "🛡️ 3 nights: guardian outfit",
      bedtimeBadge7: "🎁 7 nights: family reward",
      bedtimeNote: "Claim before {time} to earn the smile. Missing a night just means no smile — nothing is taken away.",
      bedtimePastCutoff: "It's past {time} — no smile tonight. Try again tomorrow! 🌙",
      bedtimeCutoffLabel: "Claim by (bedtime)",
      bedtimeEditLabel: "Bedtime tasks",
      bedtimeEditHint: "One task per line (up to 10). Leave empty to use the default list.",
      task_toys: "🧸 Tidy up toys",
      task_bath: "🛁 Bath & pajamas",
      task_teeth: "🪥 Brush teeth",
      task_story: "📖 Story time",
      task_bed: "🌙 In bed on time",

      madeWith: "Made with",
      forFamilies: "for happy families",
    },
    "zh-tw": {
      appTitle: "笑臉罐",
      tagline: "蒐集笑臉，一起達成目標！",
      exportBtn: "⬇️ 匯出",
      importBtn: "⬆️ 匯入",
      importConfirm: "匯入將會覆蓋目前所有小朋友與笑臉紀錄，確定要繼續嗎？",
      importSuccess: "備份匯入成功！",
      importError: "無法讀取這個檔案，請選擇正確的笑臉罐備份檔（.json）。",
      howTo: "怎麼玩",
      gotIt: "知道了",
      howto1: "只要小朋友做了值得鼓勵的好事，就點「😊 新增笑臉」，寫下原因。",
      howto2: "看著罐子隨著笑臉數量慢慢裝滿，一起邁向目標。",
      howto3: "達成目標就一起慶祝——接著可以開始新的罐子，或是提高目標！",

      addKid: "＋ 新增小朋友",
      addFirstKid: "＋ 新增第一個小朋友",
      noKidsTitle: "還沒有小朋友",
      noKids: "新增一個小朋友，開始蒐集笑臉吧！",

      nameLabel: "名字",
      namePlaceholder: "例如：小美",
      goalLabel: "目標",
      goalHint: "新增一或多個他們想達成的目標，全部加起來就是目標數量。",
      objectiveTitlePlaceholder: "例如：帶去電子材料行",
      addObjective: "＋ 新增目標項目",
      removeObjective: "刪除這個目標",
      totalGoalLabel: "總共：{total} 個笑臉",
      objectivesRequired: "請至少新增一個有名稱和笑臉數的目標",
      goalBreakdown: "目標項目",
      bonusGoalTitle: "🎁 額外目標",
      avatarLabel: "選一個圖示",
      save: "儲存",
      cancel: "取消",
      edit: "編輯",
      deleteKid: "刪除小朋友",
      confirmDeleteKid: "要刪除「{name}」和他所有的笑臉紀錄嗎？這無法復原。",

      smilesOfGoal: "{count} / {goal} 個笑臉",
      totalEver: "累計總數",
      addSmileBtn: "😊 新增笑臉",
      reasonLabel: "他做了什麼好事呢？",
      reasonPlaceholder: "例如：主動和妹妹分享玩具",
      amountLabel: "要加幾個笑臉？",
      removeSmileBtn: "➖ 扣除笑臉",
      removeReasonLabel: "發生了什麼事呢？",
      removeReasonPlaceholder: "例如：睡覺時間不聽話",
      removeAmountLabel: "要扣除幾個？",
      nameRequired: "請輸入名字",
      reasonRequired: "請寫下原因",

      history: "最近的笑臉",
      noHistory: "還沒有笑臉紀錄，新增第一筆吧！",
      deleteEntryConfirm: "要刪除這筆笑臉紀錄嗎？",

      goalReachedTitle: "達成目標了！🎉",
      goalReachedBody: "「{name}」蒐集了 {goal} 個笑臉！太棒了！",
      increaseGoal: "提高目標",
      startNewJar: "開始新的罐子",
      close: "關閉",

      bedtimeTitle: "🌙 晚安任務",
      bedtimeProgress: "已完成 {done} / {total} 項",
      bedtimeClaimBtn: "領取 1 個笑臉 😊",
      bedtimeClaimed: "今晚的笑臉領好囉，晚安！🌙",
      bedtimeClaimReason: "🌙 完成晚安任務",
      bedtimeStreak: "連續 {n} 晚",
      bedtimeBadge3: "🛡️ 連續 3 晚：守護獸造型",
      bedtimeBadge7: "🎁 連續 7 晚：家庭共同獎勵",
      bedtimeNote: "要在 {time} 前領取才有笑臉。偶爾沒完成只是沒有笑臉，不會扣掉已經有的。",
      bedtimePastCutoff: "已經超過 {time} 了，今晚沒有笑臉，明天再加油！🌙",
      bedtimeCutoffLabel: "上床時間（領取截止）",
      bedtimeEditLabel: "晚安任務",
      bedtimeEditHint: "一行一項（最多 10 項）。留空就使用預設清單。",
      task_toys: "🧸 整理玩具",
      task_bath: "🛁 洗澡換衣服",
      task_teeth: "🪥 刷牙",
      task_story: "📖 聽故事",
      task_bed: "🌙 準時上床",

      madeWith: "用 ❤️ 製作",
      forFamilies: "給幸福的家庭",
    },
  };

  const I18N = {
    lang: "en",
    listeners: [],

    init() {
      const saved = localStorage.getItem("smj_lang");
      const browser = (navigator.language || "en").toLowerCase();
      this.lang = saved || (browser.startsWith("zh") ? "zh-tw" : "en");
      this.apply();
    },

    setLang(lang) {
      if (!STRINGS[lang]) return;
      this.lang = lang;
      localStorage.setItem("smj_lang", lang);
      this.apply();
      this.listeners.forEach((fn) => fn(lang));
    },

    onChange(fn) {
      this.listeners.push(fn);
    },

    t(key, vars) {
      let str = (STRINGS[this.lang] && STRINGS[this.lang][key]) || STRINGS.en[key] || key;
      if (vars) {
        Object.keys(vars).forEach((k) => {
          str = str.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
        });
      }
      return str;
    },

    // Set an element's text, adding zhuyin <ruby> in zh-TW. <option>/<select>
    // can't render HTML, so they always get plain text.
    setText(el, str) {
      const plain = el.tagName === "OPTION" || el.tagName === "SELECT";
      if (this.lang === "zh-tw" && window.ZH && !plain) el.innerHTML = window.ZH.annotate(str);
      else el.textContent = str;
    },
    setKey(el, key, vars) { this.setText(el, this.t(key, vars)); },

    // Return HTML for embedding inside a template string (annotated in zh-TW).
    markup(str) {
      return this.lang === "zh-tw" && window.ZH ? window.ZH.annotate(str) : (window.ZH ? window.ZH.esc(str) : str);
    },

    apply() {
      document.documentElement.lang = this.lang;
      document.body && document.body.classList.toggle("zh", this.lang === "zh-tw");
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        this.setText(el, this.t(el.getAttribute("data-i18n")));
      });
      document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        el.placeholder = this.t(el.getAttribute("data-i18n-placeholder"));
      });
      document.querySelectorAll(".lang-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.lang === this.lang);
      });
    },
  };

  window.I18N = I18N;
})();
