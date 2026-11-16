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

const sizeInput = document.getElementById("sizeInput");
const markedSelect = document.getElementById("markedSelect");
const generateBtn = document.getElementById("generateBtn");
const stepBtn = document.getElementById("stepBtn");
const resetBtn = document.getElementById("resetBtn");
const errorLine = document.getElementById("errorLine");
const statusLine = document.getElementById("statusLine");
const chart = document.getElementById("chart");
const codeBtn = document.getElementById("codeBtn");
const codeModal = document.getElementById("codeModal");
const closeBtn = document.getElementById("closeBtn");
const codeText = document.getElementById("codeText");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const copyStatus = document.getElementById("copyStatus");

let secrets = [];
let marked = 0;
let amps = [];
let iterations = 0;

function optimalIterations(size) {
  return Math.max(1, Math.round((Math.PI / 4) * Math.sqrt(size) - 0.5));
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
  // קודם מערבבים את רשימת המילים, ואם צריך יותר ממה שיש, מחברים שתי מילים עם מקף
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
    option.textContent = secret;
    markedSelect.appendChild(option);
  });
  markedSelect.value = String(marked);
}

function setSearchEnabled(enabled) {
  markedSelect.disabled = !enabled;
  resetBtn.disabled = !enabled;
  codeBtn.disabled = !enabled;
  stepBtn.disabled = !enabled;
}

function startSearch() {
  const n = secrets.length;
  amps = new Array(n).fill(1 / Math.sqrt(n));
  iterations = 0;
  render();
}

function groverStep() {
  // שלב א: הופכים את הסימן של המשקל של הסוד הנכון
  amps[marked] = -amps[marked];
  // שלב ב: היפוך סביב הממוצע
  const mean = amps.reduce((sum, a) => sum + a, 0) / amps.length;
  amps = amps.map((a) => 2 * mean - a);
  iterations += 1;
}

function render() {
  const n = secrets.length;
  const optimal = optimalIterations(n);
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
  statusLine.textContent =
    `סיבוב ${iterations} מתוך ${optimal} מומלצים. ` +
    `ההסתברות לקבל את הסוד "${secrets[marked]}": ${markedProb}%`;
  stepBtn.disabled = iterations >= optimal;
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !codeModal.hidden) {
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

// ---------- מסביר watsonx.ai ----------
// הדף נטען מהשרת של הפרויקט הראשי (/grover/), ולכן /api/explain זמין כאן.
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
