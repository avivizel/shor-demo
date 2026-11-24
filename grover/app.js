"use strict";

const MAX_SECRETS = 1024;
const SHOW_DETAILS_MAX = 16;

const WORDS = [
  "ספר", "בית", "כלב", "חתול", "שמש", "ירח", "כוכב", "ים", "הר", "נהר",
  "עץ", "פרח", "דג", "ציפור", "תפוח", "לחם", "מים", "אש", "אבן", "חול",
  "ענן", "גשם", "שלג", "רוח", "דלת", "חלון", "כיסא", "שולחן", "מיטה", "מנורה",
  "מפתח", "מראה", "כובע", "נעל", "מעיל", "סל", "כד", "כוס", "צלחת", "סכין",
  "מזלג", "גזר", "בצל", "עגבנייה", "מלפפון", "תות", "אגס", "שקד", "ענב", "דבש",
  "חלב", "גבינה", "ביצה", "עוגה", "סוכר", "מלח", "פלפל", "כרית", "שמיכה", "מכונית",
  "אוטובוס", "רכבת", "אופניים", "ספינה", "מטוס", "גשר", "דרך", "עיר", "כפר", "יער",
  "מדבר", "שדה", "גן", "מגדל", "טירה", "ארמון", "כנף", "זנב", "עין", "אוזן",
  "לב", "יד", "רגל", "שן", "שיר", "תמונה", "מכתב", "עיפרון", "מחברת", "לוח",
  "גיטרה", "חליל", "תוף", "כדור", "דגל", "מסך", "מחשב", "טלפון", "שעון", "מפה",
  "מצפן", "סולם", "גלגל", "מנוע", "פסנתר", "ארנק", "מטבע", "זהב", "כסף", "ברזל",
  "נחושת", "יהלום", "אריה", "פיל", "נמר", "סוס", "פרה", "כבשה", "קוף", "ינשוף",
  "צב", "נחש", "עכביש", "פרפר", "דבורה", "נמלה", "צפרדע", "לוויתן", "דולפין", "ארנב"
];

// הסברים פשוטים לתלמידי כיתה ט' ללא ידע מוקדם
const EXPLANATIONS = {
  1: {
    title: "שלב 1: איך מוצאים מחט בערימת שחת?",
    subtitle: "הרעיון הבסיסי: חיפוש רגיל מול חיפוש קוונטי",
    sections: [
      {
        heading: "🔑 משל המנעול והקוד הסודי",
        text: "תארו לעצמכם שיש לכם לוקר בבית הספר עם מנעול קוד של 4 ספרות (10,000 אפשרויות שונות), ושכחתם את הקוד."
      },
      {
        heading: "🐢 המחשב הרגיל (חיפוש קלאסי)",
        text: "מחשב רגיל חייב לנסות קוד-אחר-קוד: 0001, 0002, 0003... בממוצע הוא יצטרך לנסות 5,000 פעמים עד שהמנעול ייפתח. אם יש מיליון אפשרויות — הוא יצטרך חצי מיליון ניסיונות!"
      },
      {
        heading: "⚡ מחשב קוונטי עם גרובר",
        text: "המחשב הקוונטי לא בודק אחד-אחד ברצף. בזכות תכונות קוונטיות מיוחדות הוא בודק את כל האפשרויות יחד כגלים, ומגביר את הסיכוי של הקוד הנכון. במקום 5,000 ניסיונות — גרובר ימצא אותו בכ-100 ניסיונות בלבד! עבור מיליון אפשרויות, יספיקו כ-1,000 בדיקות בלבד (פעולת שורש ריבועי)."
      }
    ]
  },
  2: {
    title: "שלב 2: לחשוב כמו גלים במים",
    subtitle: "משקלים (אמפליטודות) והתאבכות גלים",
    sections: [
      {
        heading: "🌊 גלים שנפגשים בבריכה",
        text: "כשאתם זורקים שתי אבנים לבריכת מים: אם גל גבוה פוגש גל גבוה אחר — נוצר גל ענק (חיזוק). אבל אם גל גבוה פוגש שקע עמוק — המים נרגעים ונהיים שטוחים לגמרי (ביטול)."
      },
      {
        heading: "📊 מה זה 'אמפליטודה' במחשב קוונטי?",
        text: "במקום להגיד 'יש 10% סיכוי', מחשב קוונטי נותן לכל תשובה 'גובה של גל' (אמפליטודה). הגל יכול להיות חיובי (מעל המים) או שלילי (שקע מתחת למים). ההסתברות בסוף שווה לגובה בריבוע (חיובי או שלילי בריבוע תמיד נותן מספר חיובי)."
      },
      {
        heading: "🎯 המטרה של גרובר",
        text: "לגרום לכל הגלים של התשובות השגויות לבטל זה את זה ולהפוך לשטוחים (אפס), בעוד שהגל של התשובה הנכונה מתחזק והופך לענק!"
      }
    ]
  },
  3: {
    title: "שלב 3: הטריק של שתי המראות",
    subtitle: "איך הופכים והיפוך סביב הממוצע מסובבים את התשובה",
    sections: [
      {
        heading: "🪞 מראה 1: הפיכת הסימן (האורקל)",
        text: "איך המחשב מסמן את התשובה הנכונה? הוא 'דוחף' את הגל של התשובה הנכונה מתחת למים והופך אותו לחיובי לשלילי (-), בזמן שכל שאר התשובות נשארות מעל המים (+)."
      },
      {
        heading: "📈 מראה 2: הקפצה סביב הממוצע (הדיפוזיה)",
        text: "עכשיו המחשב בודק מה הגובה הממוצע של כל הגלים (הוא מעט מעל האפס). כל מי שהיה רגיל (מעל הממוצע) נדחף מעט למטה. אבל התשובה הנכונה, שהייתה עמוק מתחת למים, 'מוקפצת' גבוה מאוד מעל כולם!"
      },
      {
        heading: "🔄 התוצאה: סיבוב מדויק",
        text: "חיבור שתי הפעולות האלה שקול בדיוק לסיבוב של מחוג שעון: בכל סיבוב של שני השלבים, המחוג מתקדם עוד צעד קבוע לעבר התשובה הנכונה."
      }
    ]
  },
  4: {
    title: "שלב 4: לא לפספס את המטרה!",
    subtitle: "מספר הסיבובים המיטבי ותופעת סיבוב היתר",
    sections: [
      {
        heading: "⏰ לעצור בדיוק ב-90 מעלות",
        text: "תחשבו על סיבוב מחוג שעון. בכל סיבוב (איטרציה) אנחנו מקרבים את המחוג עוד קצת אל המטרה שנמצאת ב-90 מעלות (למעלה). כשהמחוג מגיע למעלה — הסיכוי לפגוע הוא כמעט 100%!"
      },
      {
        heading: "⚠️ מה זה סיבוב יתר (Overshoot)?",
        text: "במחשב קוונטי אין כפתור 'עצור לבד'. אם תמשיכו לסובב מעבר לשיא, המחוג ימשיך ל-120 מעלות, 180 מעלות... והסיכוי לקבל את התשובה הנכונה שוב יירד לקראת אפס! לכן חובה לחשב מראש בדיוק כמה פעמים לסובב ולעצור בזמן."
      }
    ]
  },
  5: {
    title: "שלב 5: איך לשחק בסימולטור?",
    subtitle: "מדריך מהיר להפעלת ההדמיה",
    sections: [
      {
        heading: "🎮 צעדים פשוטים להדמיה",
        text: "1. רשמו כמה מילים אתם רוצים (למשל 8 או 16) ולחצו 'יצירת סודות'.\n2. בחרו מילה שאתם רוצים למצוא.\n3. לחצו על 'סיבוב הבא' וראו איך העמודה הירוקה גדלה והכחולות נעלמות!\n4. נסו להמשיך ללחוץ מעבר לסיבוב המומלץ — וראו במו עיניכם איך העמודה הירוקה שוב מתחילה לרדת בגלל סיבוב יתר."
      }
    ]
  },
  6: {
    title: "שלב 6: למה מחשבים קוונטיים כל כך רגישים?",
    subtitle: "השפעת רעש, שגיאות ואיבוד קוהרנטיות",
    sections: [
      {
        heading: "📻 רעש סטטי ברדיו",
        text: "קיוביטים הם חלקיקים עדינים במיוחד. כל רעד קל, חום או הפרעה חשמלית מייצרים 'רעש' שמשבש את החישוב."
      },
      {
        heading: "❄️ גלים שקופאים",
        text: "החוקרים חאן ופריאד הוכיחו שאם רעש מעיף חלק מהגל הקוונטי מחוץ למסלול — החלק הזה 'קופא' ולא מוגבר יותר לעולם."
      },
      {
        heading: "⏱️ שגיאות בהתחלה מול הסוף",
        text: "שגיאה של שינוי סימן (פאזה) בתחילת החישוב הורסת הכל מיד. שגיאה של היפוך ביט בסוף החישוב חוטפת את התשובה בדיוק כשהיינו קרובים למטרה. לכן כשקיים רעש, לעיתים כדאי לעצור סיבוב אחד קודם!"
      }
    ]
  },
  7: {
    title: "שלב 7: מתמטיקה בלי להיבהל",
    subtitle: "רק מעגלים וזוויות",
    sections: [
      {
        heading: "📐 הכל זה רק זווית על מעגל",
        text: "הנוסחאות המסובכות הן בסך הכל תיאור של זווית במעגל: אלפא (α) היא הצעד הקטן הראשון. בכל איטרציה גרובר מתקדם בעוד 2 אלפא. כשהזווית מגיעה ל-90 מעלות (פאי חלקי 2) — פגענו בול במטרה!"
      }
    ]
  },
  8: {
    title: "שלב 8: קרב המוחות: האקרים מול מפתחות",
    subtitle: "האם מחשב קוונטי יכול לפרוץ לנו את הסיסמאות?",
    sections: [
      {
        heading: "🛡️ הצפנה כמו כספת ענקית",
        text: "כשאתם שולחים הודעת וואטסאפ או משלמים באשראי, ההודעה ננעלת עם מפתח הצפנה (כמו סיסמה של 128 תווים). למחשב רגיל ייקחו מיליארדי שנים לנחש אותה."
      },
      {
        heading: "✂️ גרובר 'חותך' את המנעול בחצי",
        text: "בגלל שגרובר עושה פעולת שורש, מפתח של 128 ביט מרגיש מולו כאילו הוא רק 64 ביט (שאותו מחשב קוונטי עתידי יוכל לנסות לנחש)."
      },
      {
        heading: "🔒 הפתרון הפשוט: מפתח ארוך כפול!",
        text: "פשוט משתמשים במפתח של 256 ביט (AES-256). מול גרובר הוא הופך ל-128 ביט — וזה עדיין בלתי ניתן לפריצה בשום מחשב בעולם!"
      }
    ]
  }
};

const sizeInput = document.getElementById("sizeInput");
const markedSelect = document.getElementById("markedSelect");
const noiseSelect = document.getElementById("noiseSelect");
const generateBtn = document.getElementById("generateBtn");
const stepBtn = document.getElementById("stepBtn");
const resetBtn = document.getElementById("resetBtn");
const errorLine = document.getElementById("errorLine");
const statusLine = document.getElementById("statusLine");
const geomInfo = document.getElementById("geomInfo");
const chart = document.getElementById("chart");
const codeBtn = document.getElementById("codeBtn");
const codeModal = document.getElementById("codeModal");
const closeBtn = document.getElementById("closeBtn");
const codeText = document.getElementById("codeText");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const copyStatus = document.getElementById("copyStatus");

// אלמנטים של חלון ההסבר הפשוט
const explainModal = document.getElementById("explainModal");
const explainTitle = document.getElementById("explainTitle");
const explainSubtitle = document.getElementById("explainSubtitle");
const explainBody = document.getElementById("explainBody");
const closeExplainBtn = document.getElementById("closeExplainBtn");

let secrets = [];
let marked = 0;
let amps = [];
let iterations = 0;

// חישוב זווית התחלתית alpha: sin(alpha) = 1 / sqrt(N)
function initialAngle(size) {
  return Math.asin(1 / Math.sqrt(size));
}

// חישוב מספר איטרציות מיטבי מדויק r_0 לפי נוסחת המאמר: r_0 ~= (pi / (4*alpha)) - 0.5
function optimalIterations(size) {
  const alpha = initialAngle(size);
  return Math.max(1, Math.round((Math.PI / (4 * alpha)) - 0.5));
}

// חישוב מספר איטרציות מיטבי עם רעש דפולריזציה r*
function noisyOptimalIterations(size, pg) {
  const r0 = optimalIterations(size);
  if (pg <= 0) return r0;
  const shift = (3 * pg * (size - 1)) / 8;
  return Math.max(1, Math.round(r0 - shift));
}

function randomInt(max) {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] % max;
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function randomWord() {
  return WORDS[randomInt(WORDS.length)];
}

function generateSecrets(count) {
  const list = shuffle(WORDS.slice()).slice(0, count);
  const used = new Set(list);
  while (list.length < count) {
    const compound = `${randomWord()}-${randomWord()}`;
    if (!used.has(compound)) {
      used.add(compound);
      list.push(compound);
    }
  }
  return list;
}

function fillMarkedOptions() {
  markedSelect.replaceChildren();
  secrets.forEach((secret, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${index + 1}. ${secret}`;
    markedSelect.appendChild(option);
  });
  markedSelect.value = String(marked);
}

function setSearchEnabled(enabled) {
  markedSelect.disabled = !enabled;
  if (noiseSelect) noiseSelect.disabled = !enabled;
  resetBtn.disabled = !enabled;
  codeBtn.disabled = !enabled;
  stepBtn.disabled = !enabled;
}

function getNoiseRate() {
  if (!noiseSelect) return 0;
  return parseFloat(noiseSelect.value) || 0;
}

function startSearch() {
  const n = secrets.length;
  amps = new Array(n).fill(1 / Math.sqrt(n));
  iterations = 0;
  render();
}

function groverStep() {
  // שלב א: אורקל U_f = I - 2|w><w| (שיקוף סביב ציר המצבים הלא-מסומנים |w_perp>)
  amps[marked] = -amps[marked];

  // שלב ב: דיפוזיה V = 2|s><s| - I (שיקוף סביב הסופרפוזיציה האחידה |s>, היפוך סביב הממוצע)
  const mean = amps.reduce((sum, a) => sum + a, 0) / amps.length;
  amps = amps.map((a) => 2 * mean - a);

  iterations += 1;

  // דפולריזציה ברמת השכבות
  const pg = getNoiseRate();
  if (pg > 0) {
    const factor = Math.pow(1 - pg, 3);
    const n = amps.length;
    const currentProbs = amps.map((a) => a * a);
    const noisyProbs = currentProbs.map((p) => factor * p + (1 - factor) / n);
    amps = amps.map((a, i) => Math.sign(a || 1) * Math.sqrt(Math.max(0, noisyProbs[i])));
  }
}

function render() {
  const n = secrets.length;
  const alpha = initialAngle(n);
  const r0 = optimalIterations(n);
  const pg = getNoiseRate();
  const rStar = noisyOptimalIterations(n, pg);

  // זווית במישור הדו-ממדי: theta_r = (2*r + 1) * alpha
  const currentAngle = (2 * iterations + 1) * alpha;
  const currentAngleDeg = (currentAngle * (180 / Math.PI)).toFixed(1);

  // הסתברות הצלחה תאורטית
  let theoreticalProb = Math.pow(Math.sin(currentAngle), 2);
  if (pg > 0) {
    const survival = Math.pow(1 - pg, 3 * iterations + 1);
    theoreticalProb = survival * theoreticalProb + (1 - survival) / n;
  }

  const probs = amps.map((a) => a * a);
  const maxProb = Math.max(...probs, 1e-9);
  const showDetails = n <= SHOW_DETAILS_MAX;

  chart.replaceChildren();
  probs.forEach((p, i) => {
    const isMarked = i === marked;
    const column = document.createElement("div");
    column.className = isMarked ? "column marked" : "column";
    column.title = `${secrets[i]}: ${(p * 100).toFixed(2)}%`;

    if (showDetails || isMarked) {
      const value = document.createElement("div");
      value.className = "value";
      value.textContent = `${(p * 100).toFixed(1)}%`;
      column.appendChild(value);
    }

    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${Math.max(0, (p / maxProb) * 100)}%`;
    column.appendChild(bar);

    if (showDetails || isMarked) {
      const label = document.createElement("div");
      label.className = "label";
      label.textContent = secrets[i];
      column.appendChild(label);
    }

    chart.appendChild(column);
  });

  const markedProb = (probs[marked] * 100).toFixed(1);

  // הערכת מצב גאומטרי
  let geomStatusText = "";
  if (iterations === 0) {
    geomStatusText = `מצב התחלתי: זווית ${currentAngleDeg}° (${currentAngle.toFixed(3)} רדיאנים). שוויון הסתברויות מוחלט ${(100 / n).toFixed(2)}%.`;
  } else if (iterations === r0 || (pg > 0 && iterations === rStar)) {
    geomStatusText = `נקודה מיטבית! הזווית הגיעה ל-${currentAngleDeg}° (קרוב ביותר ל-90°). ההסתברות המרבית הושגה.`;
  } else if (iterations < r0) {
    geomStatusText = `בסיבוב: הזווית מתקדמת ב-${(2 * alpha * (180 / Math.PI)).toFixed(1)}° בכל איטרציה לעבר 90°. כעת: ${currentAngleDeg}°.`;
  } else {
    geomStatusText = `סיבוב יתר (Overshoot): הזווית עברה את 90° (${currentAngleDeg}°), ולכן ההסתברות מתחילה לרדת שוב בגלל מחזוריות הסיבוב.`;
  }

  const optimalTarget = pg > 0 ? rStar : r0;
  statusLine.textContent =
    `איטרציה ${iterations} (המיטבי: ${optimalTarget} סיבובים). ` +
    `ההסתברות לסוד "${secrets[marked]}": ${markedProb}% (תאורטית: ${(theoreticalProb * 100).toFixed(1)}%).`;

  if (geomInfo) {
    geomInfo.textContent = geomStatusText;
  }

  stepBtn.disabled = iterations >= Math.max(15, r0 * 3);
}

generateBtn.addEventListener("click", () => {
  const count = Number(sizeInput.value);
  if (!Number.isInteger(count) || count < 2 || count > MAX_SECRETS) {
    errorLine.textContent = `יש להזין מספר שלם בין 2 ל־${MAX_SECRETS}.`;
    errorLine.hidden = false;
    return;
  }
  errorLine.textContent = "";
  errorLine.hidden = true;
  secrets = generateSecrets(count);
  marked = 0;
  fillMarkedOptions();
  setSearchEnabled(true);
  startSearch();
});

markedSelect.addEventListener("change", () => {
  marked = Number(markedSelect.value);
  startSearch();
});

if (noiseSelect) {
  noiseSelect.addEventListener("change", () => {
    startSearch();
  });
}

resetBtn.addEventListener("click", startSearch);

stepBtn.addEventListener("click", () => {
  groverStep();
  render();
});

codeBtn.addEventListener("click", () => {
  codeText.textContent = buildQiskitCode(secrets, marked);
  copyStatus.hidden = true;
  codeModal.hidden = false;
});

function closeCodeModal() {
  codeModal.hidden = true;
}

closeBtn.addEventListener("click", closeCodeModal);

codeModal.addEventListener("click", (event) => {
  if (event.target.dataset.close) {
    closeCodeModal();
  }
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(codeText.textContent);
    copyStatus.textContent = "הקוד הועתק ללוח.";
  } catch (error) {
    copyStatus.textContent = "ההעתקה נכשלה. אפשר להעתיק את הקוד ידנית.";
  }
  copyStatus.hidden = false;
});

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([codeText.textContent], { type: "text/x-python;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "grover_search.py";
  link.click();
  URL.revokeObjectURL(link.href);
});

// ---------- חלון קופץ: הסבר פשוט לתלמידי כיתה ט' ----------
function openExplainModal(stepNumber) {
  const data = EXPLANATIONS[stepNumber];
  if (!data) return;

  explainTitle.textContent = data.title;
  explainSubtitle.textContent = data.subtitle;
  explainBody.replaceChildren();

  data.sections.forEach((sec) => {
    const secEl = document.createElement("div");
    secEl.className = "explain-section";

    const headingEl = document.createElement("h4");
    headingEl.textContent = sec.heading;
    secEl.appendChild(headingEl);

    const textEl = document.createElement("p");
    textEl.textContent = sec.text;
    secEl.appendChild(textEl);

    explainBody.appendChild(secEl);
  });

  explainModal.hidden = false;
}

function closeExplainModal() {
  explainModal.hidden = true;
}

if (closeExplainBtn) {
  closeExplainBtn.addEventListener("click", closeExplainModal);
}

if (explainModal) {
  explainModal.addEventListener("click", (event) => {
    if (event.target.dataset.close) {
      closeExplainModal();
    }
  });
}

document.querySelectorAll(".explain-trigger-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const step = btn.dataset.explainStep;
    if (step) {
      openExplainModal(step);
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!codeModal.hidden) closeCodeModal();
    if (explainModal && !explainModal.hidden) closeExplainModal();
  }
});

// ---------- מסביר watsonx.ai ----------
const askForm = document.getElementById("ask-form");
const questionBox = document.getElementById("question");
const askCount = document.getElementById("ask-count");
const askBtn = document.getElementById("ask-btn");
const askStatus = document.getElementById("ask-status");
const askError = document.getElementById("ask-error");
const askAnswer = document.getElementById("ask-answer");

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "הבקשה נכשלה. נסו שוב.");
  }
  return data;
}

function updateAskCount() {
  askCount.textContent = `${questionBox.value.length} מתוך 300 תווים`;
}

askForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = questionBox.value.trim();
  askError.hidden = true;
  askAnswer.hidden = true;
  if (!question) {
    askError.textContent = "כתבו שאלה.";
    askError.hidden = false;
    return;
  }
  askBtn.disabled = true;
  askStatus.hidden = false;
  try {
    const data = await postJson("/api/explain", { question });
    askAnswer.replaceChildren();
    const paragraph = document.createElement("p");
    paragraph.textContent = data.answer;
    askAnswer.appendChild(paragraph);
    askAnswer.hidden = false;
  } catch (error) {
    askError.textContent = error.message || "אין קשר לשרת המקומי.";
    askError.hidden = false;
  } finally {
    askBtn.disabled = false;
    askStatus.hidden = true;
  }
});

questionBox.addEventListener("input", updateAskCount);
updateAskCount();
