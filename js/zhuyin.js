/* zhuyin.js — Bopomofo (注音) annotation for Traditional Chinese.
   Renders each Han character with its zhuyin to the RIGHT of the character
   via <ruby>-style spans, so young readers in Taiwan can read the UI. Tones:
   1st = unmarked, 2nd ˊ, 3rd ˇ, 4th ˋ, neutral ˙ (prefix). */
(function () {
  const CHARS = {
    "笑": "ㄒㄧㄠˋ", "臉": "ㄌㄧㄢˇ", "罐": "ㄍㄨㄢˋ", "蒐": "ㄙㄡ", "集": "ㄐㄧˊ",
    "一": "ㄧ", "起": "ㄑㄧˇ", "達": "ㄉㄚˊ", "成": "ㄔㄥˊ", "目": "ㄇㄨˋ",
    "標": "ㄅㄧㄠ", "怎": "ㄗㄣˇ", "麼": "˙ㄇㄜ", "玩": "ㄨㄢˊ", "新": "ㄒㄧㄣ",
    "增": "ㄗㄥ", "小": "ㄒㄧㄠˇ", "朋": "ㄆㄥˊ", "友": "ㄧㄡˇ", "名": "ㄇㄧㄥˊ",
    "字": "ㄗˋ", "例": "ㄌㄧˋ", "如": "ㄖㄨˊ", "美": "ㄇㄟˇ", "要": "ㄧㄠˋ",
    "幾": "ㄐㄧˇ", "個": "ㄍㄜˋ", "才": "ㄘㄞˊ", "能": "ㄋㄥˊ", "裝": "ㄓㄨㄤ",
    "滿": "ㄇㄢˇ", "子": "˙ㄗ", "選": "ㄒㄩㄢˇ", "圖": "ㄊㄨˊ", "示": "ㄕˋ",
    "儲": "ㄔㄨˇ", "存": "ㄘㄨㄣˊ", "取": "ㄑㄩˇ", "消": "ㄒㄧㄠ", "還": "ㄏㄞˊ",
    "沒": "ㄇㄟˊ", "有": "ㄧㄡˇ", "開": "ㄎㄞ", "始": "ㄕˇ", "吧": "˙ㄅㄚ",
    "第": "ㄉㄧˋ", "他": "ㄊㄚ", "做": "ㄗㄨㄛˋ", "什": "ㄕㄣˊ", "好": "ㄏㄠˇ",
    "事": "ㄕˋ", "呢": "˙ㄋㄜ", "主": "ㄓㄨˇ", "動": "ㄉㄨㄥˋ", "和": "ㄏㄜˊ",
    "妹": "ㄇㄟˋ", "分": "ㄈㄣ", "享": "ㄒㄧㄤˇ", "具": "ㄐㄩˋ", "加": "ㄐㄧㄚ",
    "最": "ㄗㄨㄟˋ", "近": "ㄐㄧㄣˋ", "的": "˙ㄉㄜ", "紀": "ㄐㄧˋ", "錄": "ㄌㄨˋ",
    "筆": "ㄅㄧˇ", "累": "ㄌㄟˇ", "計": "ㄐㄧˋ", "總": "ㄗㄨㄥˇ", "數": "ㄕㄨˋ",
    "編": "ㄅㄧㄢ", "輯": "ㄐㄧˊ", "刪": "ㄕㄢ", "除": "ㄔㄨˊ", "所": "ㄙㄨㄛˇ",
    "嗎": "˙ㄇㄚ", "這": "ㄓㄜˋ", "無": "ㄨˊ", "法": "ㄈㄚˇ", "復": "ㄈㄨˋ",
    "原": "ㄩㄢˊ", "了": "˙ㄌㄜ", "太": "ㄊㄞˋ", "棒": "ㄅㄤˋ", "提": "ㄊㄧˊ",
    "高": "ㄍㄠ", "關": "ㄍㄨㄢ", "閉": "ㄅㄧˋ", "知": "ㄓ", "道": "ㄉㄠˋ",
    "只": "ㄓˇ", "值": "ㄓˊ", "得": "ㄉㄜˊ", "鼓": "ㄍㄨˇ", "勵": "ㄌㄧˋ",
    "就": "ㄐㄧㄡˋ", "點": "ㄉㄧㄢˇ", "寫": "ㄒㄧㄝˇ", "下": "ㄒㄧㄚˋ", "因": "ㄧㄣ",
    "看": "ㄎㄢˋ", "著": "˙ㄓㄜ", "隨": "ㄙㄨㄟˊ", "量": "ㄌㄧㄤˋ", "慢": "ㄇㄢˋ",
    "邁": "ㄇㄞˋ", "向": "ㄒㄧㄤˋ", "慶": "ㄑㄧㄥˋ", "祝": "ㄓㄨˋ", "接": "ㄐㄧㄝ",
    "可": "ㄎㄜˇ", "以": "ㄧˇ", "或": "ㄏㄨㄛˋ", "是": "ㄕˋ", "用": "ㄩㄥˋ",
    "製": "ㄓˋ", "作": "ㄗㄨㄛˋ", "給": "ㄍㄟˇ", "幸": "ㄒㄧㄥˋ", "福": "ㄈㄨˊ",
    "家": "ㄐㄧㄚ", "庭": "ㄊㄧㄥˊ", "請": "ㄑㄧㄥˇ", "輸": "ㄕㄨ", "入": "ㄖㄨˋ",
    // Punishment / remove-a-smile
    "扣": "ㄎㄡˋ", "發": "ㄈㄚ", "生": "ㄕㄥ", "睡": "ㄕㄨㄟˋ", "覺": "ㄐㄧㄠˋ",
    "時": "ㄕˊ", "間": "ㄐㄧㄢ", "不": "ㄅㄨˋ", "聽": "ㄊㄧㄥ", "話": "ㄏㄨㄚˋ",
  };

  // Multi-character overrides for context-dependent (polyphone) readings.
  const PHRASES = {};

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function isHan(ch) {
    const c = ch.codePointAt(0);
    return c >= 0x4e00 && c <= 0x9fff;
  }
  // Bopomofo to the RIGHT of the character. Symbols stack vertically; the tone
  // mark sits BESIDE the column (2nd/3rd/4th to the right, neutral ˙ on top).
  const TONE_MARKS = { "ˊ": 1, "ˇ": 1, "ˋ": 1, "˙": 1 };
  function ruby(ch, zh) {
    let base = zh, tone = "", neutral = false;
    if (zh[0] === "˙") { neutral = true; tone = "˙"; base = zh.slice(1); }
    else {
      const last = zh[zh.length - 1];
      if (TONE_MARKS[last]) { tone = last; base = zh.slice(0, -1); }
    }
    const baseSpan = `<span class="zy-b">${esc(base)}</span>`;
    let cluster;
    if (neutral) cluster = `<span class="zy-z zy-neu"><span class="zy-t">${esc(tone)}</span>${baseSpan}</span>`;
    else if (tone) cluster = `<span class="zy-z">${baseSpan}<span class="zy-t">${esc(tone)}</span></span>`;
    else cluster = `<span class="zy-z">${baseSpan}</span>`;
    return `<span class="zy"><span class="zy-c">${esc(ch)}</span>${cluster}</span>`;
  }

  function annotate(str) {
    let out = "";
    let i = 0;
    while (i < str.length) {
      let matched = false;
      for (let len = 4; len >= 2; len--) {
        const sub = str.substr(i, len);
        if (PHRASES[sub]) {
          for (let k = 0; k < sub.length; k++) out += ruby(sub[k], PHRASES[sub][k]);
          i += len;
          matched = true;
          break;
        }
      }
      if (matched) continue;
      const ch = str[i];
      if (isHan(ch) && CHARS[ch]) out += ruby(ch, CHARS[ch]);
      else out += esc(ch);
      i++;
    }
    return out;
  }

  window.ZH = { annotate, esc, CHARS, PHRASES };
})();
