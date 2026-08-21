/* i18n.js — bilingual strings (English + 繁體中文) and helpers.
   Same pattern as code-quest-kids: I18N.t(key) + I18N.setKey(el, key), with
   zh-TW text auto-annotated with zhuyin via window.ZH. */
(function () {
  const STRINGS = {
    en: {
      appTitle: "Smile Jar",
      tagline: "Collect smiles, reach your goal!",
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
      goalHint: "How many smiles to fill the jar?",
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

      madeWith: "Made with",
      forFamilies: "for happy families",
    },
    "zh-tw": {
      appTitle: "微笑罐",
      tagline: "蒐集微笑，一起達成目標！",
      howTo: "怎麼玩",
      gotIt: "知道了",
      howto1: "只要小朋友做了值得鼓勵的好事，就點「😊 新增微笑」，寫下原因。",
      howto2: "看著罐子隨著微笑數量慢慢裝滿，一起邁向目標。",
      howto3: "達成目標就一起慶祝——接著可以開始新的罐子，或是提高目標！",

      addKid: "＋ 新增小朋友",
      addFirstKid: "＋ 新增第一個小朋友",
      noKidsTitle: "還沒有小朋友",
      noKids: "新增一個小朋友，開始蒐集微笑吧！",

      nameLabel: "名字",
      namePlaceholder: "例如：小美",
      goalLabel: "目標",
      goalHint: "要蒐集幾個微笑才能裝滿罐子？",
      avatarLabel: "選一個圖示",
      save: "儲存",
      cancel: "取消",
      edit: "編輯",
      deleteKid: "刪除小朋友",
      confirmDeleteKid: "要刪除「{name}」和他所有的微笑紀錄嗎？這無法復原。",

      smilesOfGoal: "{count} / {goal} 個微笑",
      totalEver: "累計總數",
      addSmileBtn: "😊 新增微笑",
      reasonLabel: "他做了什麼好事呢？",
      reasonPlaceholder: "例如：主動和妹妹分享玩具",
      amountLabel: "要加幾個微笑？",
      nameRequired: "請輸入名字",
      reasonRequired: "請寫下原因",

      history: "最近的微笑",
      noHistory: "還沒有微笑紀錄，新增第一筆吧！",
      deleteEntryConfirm: "要刪除這筆微笑紀錄嗎？",

      goalReachedTitle: "達成目標了！🎉",
      goalReachedBody: "「{name}」蒐集了 {goal} 個微笑！太棒了！",
      increaseGoal: "提高目標",
      startNewJar: "開始新的罐子",
      close: "關閉",

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
