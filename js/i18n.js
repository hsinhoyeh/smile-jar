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

      questBedtimeTitle: "🌙 Bedtime Quest",
      questSchoolTitle: "🎒 School Quest",
      questOutingTitle: "🚗 Outing Quest",
      questClaimed_outing: "Today's outing smile is claimed. Great trip! 🚗",
      questReason_outing: "🚗 Finished the outing quest",
      questNoteFree: "Tick every task, then claim one smile for the outing (once a day). Missing one just means no smile.",
      task_pack: "🍪 Pack own snack & water bottle",
      task_summary: "🗣️ Tell a summary of where we went",
      task_calm: "😊 Stayed calm the whole time",
      questProgress: "{done} / {total} tasks done",
      questClaimBtn: "Claim 1 smile 😊",
      questClaimed_bedtime: "Tonight's smile is claimed. Sweet dreams! 🌙",
      questClaimed_school: "This morning's smile is claimed. Have a great day! 🎒",
      questReason_bedtime: "🌙 Finished the bedtime quest",
      questReason_school: "🎒 Finished the school quest",
      questStreak_bedtime: "{n}-night streak",
      questStreak_school: "{n}-day streak",
      questBadge3_bedtime: "🛡️ 3 nights: guardian outfit",
      questBadge7_bedtime: "🎁 7 nights: family reward",
      questBadge3_school: "🦸 3 days: hero outfit",
      questBadge7_school: "🎁 7 days: family reward",
      questNote: "Claim between {from} and {time} to earn the smile. A missed day just means no smile — nothing is taken away.",
      questEarly: "Opens at {from}. Come back then! ⏰",
      questLate: "It's past {time} — no smile today. Try again tomorrow!",
      questCutoffLabel: "Claim closes at",
      questFromLabel: "Claim opens at",
      questWindowInvalid: "The opening time must be earlier than the closing time.",
      questEditHint: "One task per line (up to 10). Leave empty to use the default list.",
      task_toys: "🧸 Tidy up toys",
      task_bath: "🛁 Bath & pajamas",
      task_teeth: "🪥 Brush teeth",
      task_toilet: "🚽 Go to the toilet",
      task_bed: "🌙 In bed on time",
      task_wake: "⏰ Wake up on time",
      task_wash: "🪥 Brush teeth & wash face",
      task_dress: "👕 Get dressed",
      task_breakfast: "🍳 Eat breakfast",
      task_bag: "🎒 Pack school bag",

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

      questBedtimeTitle: "🌙 晚安任務",
      questSchoolTitle: "🎒 上學任務",
      questOutingTitle: "🚗 出門任務",
      questClaimed_outing: "今天出門的笑臉領好囉，玩得開心！🚗",
      questReason_outing: "🚗 完成出門任務",
      questNoteFree: "全部做到就能領 1 個笑臉（一天一次）。沒做到只是沒有笑臉，不會扣掉已經有的。",
      task_pack: "🍪 自己收拾餅乾水壺",
      task_summary: "🗣️ 回家說出去哪裡玩的摘要",
      task_calm: "😊 全程沒有生氣",
      questProgress: "已完成 {done} / {total} 項",
      questClaimBtn: "領取 1 個笑臉 😊",
      questClaimed_bedtime: "今晚的笑臉領好囉，晚安！🌙",
      questClaimed_school: "今天早上的笑臉領好囉，上學愉快！🎒",
      questReason_bedtime: "🌙 完成晚安任務",
      questReason_school: "🎒 完成上學任務",
      questStreak_bedtime: "連續 {n} 晚",
      questStreak_school: "連續 {n} 天",
      questBadge3_bedtime: "🛡️ 連續 3 晚：守護獸造型",
      questBadge7_bedtime: "🎁 連續 7 晚：家庭共同獎勵",
      questBadge3_school: "🦸 連續 3 天：英雄造型",
      questBadge7_school: "🎁 連續 7 天：家庭共同獎勵",
      questNote: "要在 {from} 到 {time} 之間領取才有笑臉。沒完成只是沒有笑臉，不會扣掉已經有的。",
      questEarly: "{from} 才開始領取，到時候再來！⏰",
      questLate: "已經超過 {time} 了，今天沒有笑臉，明天再加油！",
      questCutoffLabel: "領取截止時間",
      questFromLabel: "開始領取時間",
      questWindowInvalid: "開始時間必須早於截止時間。",
      questEditHint: "一行一項（最多 10 項）。留空就使用預設清單。",
      task_toys: "🧸 整理玩具",
      task_bath: "🛁 洗澡換衣服",
      task_teeth: "🪥 刷牙",
      task_toilet: "🚽 上廁所",
      task_bed: "🌙 準時上床",
      task_wake: "⏰ 準時起床",
      task_wash: "🪥 刷牙洗臉",
      task_dress: "👕 穿好衣服",
      task_breakfast: "🍳 吃早餐",
      task_bag: "🎒 整理書包",

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
