const form = document.querySelector("#message-form");
const messageBox = document.querySelector("#message");
const charCount = document.querySelector("#char-count");
const encryptBtn = document.querySelector("#encrypt-btn");
const errorBox = document.querySelector("#error");
const afterEncrypt = document.querySelector("#after-encrypt");
const afterShor = document.querySelector("#after-shor");
const walkthrough = document.querySelector("#walkthrough");
const cipherGrid = document.querySelector("#cipher-grid");
const cipherString = document.querySelector("#cipher-string");
const classicalBtn = document.querySelector("#classical-btn");
const classicalSim = document.querySelector("#classical-sim");
const classicalStatus = document.querySelector("#classical-status");
const classicalBar = document.querySelector("#classical-bar");
const classicalAttempts = document.querySelector("#classical-attempts");
const classicalResult = document.querySelector("#classical-result");
const shorBtn = document.querySelector("#shor-btn");
const shorHint = document.querySelector("#shor-hint");
const shorStatus = document.querySelector("#shor-status");
const shorStory = document.querySelector("#shor-story");
const recovered = document.querySelector("#recovered");
const compare = document.querySelector("#compare");
const modal = document.querySelector("#modal");
const modalTitle = document.querySelector("#modal-title");
const modalCode = document.querySelector("#modal-code");

let sentText = "";
let cipherDigits = [];
let pythonCode = "";
let qiskitCode = "";
let classicalTimer = null;

function showError(text) {
  errorBox.hidden = !text;
  errorBox.textContent = text || "";
}

function labelOf(char) {
  return char === " " ? "רווח" : char;
}

function addParagraph(parent, parts) {
  const paragraph = document.createElement("p");
  parts.forEach((part) => {
    if (part.strong) {
      const strong = document.createElement("strong");
      strong.textContent = part.text;
      paragraph.appendChild(strong);
    } else {
      paragraph.appendChild(document.createTextNode(part.text));
    }
  });
  parent.appendChild(paragraph);
}

function updateCount() {
  charCount.textContent = `${messageBox.value.length} מתוך 120 תווים`;
}

function resetLaterSteps() {
  if (classicalTimer) {
    clearInterval(classicalTimer);
    classicalTimer = null;
  }
  afterEncrypt.hidden = true;
  afterShor.hidden = true;
  classicalSim.hidden = true;
  classicalResult.hidden = true;
  shorStatus.hidden = true;
  shorBtn.disabled = true;
  shorHint.hidden = false;
  classicalBtn.disabled = false;
  cipherDigits = [];
  cipherString.textContent = "";
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "משהו השתבש. אפשר לנסות שוב.");
  }
  return data;
}

function renderWalkthrough(item) {
  walkthrough.replaceChildren();
  const [tens, ones] = item.digits;
  const [tensPower, onesPower] = item.powers;
  const [tensCipher, onesCipher] = item.cipher;
  addParagraph(walkthrough, [
    { text: "התו הראשון הוא " },
    { text: labelOf(item.char), strong: true },
    { text: ". המקום שלו באלפבית הוא " },
    { text: String(item.index), strong: true },
    { text: "." },
  ]);
  addParagraph(walkthrough, [
    { text: "מפצלים את המספר לשתי ספרות: " },
    { text: String(tens), strong: true },
    { text: " ו-" },
    { text: String(ones), strong: true },
    { text: "." },
  ]);
  walkthrough.appendChild(digitSentence(tens, tensPower, tensCipher));
  walkthrough.appendChild(digitSentence(ones, onesPower, onesCipher));
}

function digitSentence(digit, power, cipher) {
  const paragraph = document.createElement("p");
  const sentence = power < 15
    ? `${digit} בחזקת 3 שווה ${power}. זה קטן מ-15, אז השארית היא ${cipher}.`
    : `${digit} בחזקת 3 שווה ${power}. מחלקים ב-15, והשארית היא ${cipher}.`;
  paragraph.textContent = sentence;
  return paragraph;
}

function renderCipher(characters) {
  const digits = characters.flatMap((item) => item.cipher);
  cipherString.textContent = digits.join(" ");
  cipherGrid.replaceChildren();
  characters.forEach((item) => {
    const card = document.createElement("article");
    card.className = "cipher-card";
    const glyph = document.createElement("p");
    glyph.className = "glyph";
    glyph.textContent = labelOf(item.char);
    const meta = document.createElement("p");
    meta.className = "hint";
    meta.textContent = `מספר ${item.index}, ספרות ${item.digits[0]} ו-${item.digits[1]}`;
    const lock = document.createElement("p");
    lock.className = "lock";
    lock.textContent = `${item.cipher[0]} , ${item.cipher[1]}`;
    card.append(glyph, meta, lock);
    cipherGrid.appendChild(card);
  });
}

function renderStory(data) {
  shorStory.replaceChildren();
  const intro = document.createElement("div");
  intro.className = "example";
  addParagraph(intro, [
    { text: "המעגל השתמש ב-" },
    { text: String(data.control_qubits + data.target_qubits), strong: true },
    { text: " קיוביטים: " },
    { text: String(data.control_qubits), strong: true },
    { text: " למדידה, ו-" },
    { text: String(data.target_qubits), strong: true },
    { text: " כדי לייצג מספרים עד 15. הוא רץ על הסימולטור במחשב הזה." },
  ]);
  shorStory.appendChild(intro);

  data.attempts.forEach((attempt) => {
    const block = document.createElement("article");
    block.className = "attempt";
    const title = document.createElement("p");
    const titleStrong = document.createElement("strong");
    titleStrong.textContent = attempt.success ? "המדידה שהצליחה" : "מדידה שלא הספיקה";
    title.appendChild(titleStrong);
    const detail = document.createElement("p");
    detail.textContent = `השבר שנמדד: ${attempt.phase}. ניחוש למחזור: ${attempt.r}. זה הופיע ${attempt.count.toLocaleString("he-IL")} פעמים מתוך ${data.shots.toLocaleString("he-IL")}.`;
    const why = document.createElement("p");
    why.textContent = attempt.why;
    block.append(title, detail, why);
    shorStory.appendChild(block);
  });

  const math = document.createElement("div");
  math.className = "example";
  const sign = data.delta < 0 ? "פחות" : "ועוד";
  addParagraph(math, [
    { text: `${data.a} בחזקת ${data.half} שווה ${data.raw_power}. ${data.raw_power} ${sign} 1 שווה ${data.partner}. ` },
    { text: "המספר הגדול ביותר שמחלק גם את " },
    { text: String(data.partner), strong: true },
    { text: " וגם את 15 הוא " },
    { text: String(data.found_factor), strong: true },
    { text: `. 15 לחלק ל-${data.found_factor} שווה ${data.other_factor}.` },
  ]);
  addParagraph(math, [
    { text: `אז 15 = ${data.p} × ${data.q}. ` },
    { text: `(${data.p}−1) כפול (${data.q}−1) שווה ${data.phi}. ` },
    { text: `מחפשים d כך ש-${data.e} כפול d, בחלוקה ב-${data.phi}, נותן שארית 1. יוצא d = ${data.d}.` },
  ]);
  addParagraph(math, [
    { text: "עכשיו כל ספרה מוצפנת נפתחת: מחשבים אותה בחזקת d, ולוקחים שארית בחלוקה ב-15. זוגות הספרות חוזרים להיות תווים." },
  ]);
  shorStory.appendChild(math);
}

function renderCompare(seconds) {
  compare.replaceChildren();
  const rows = [
    ["ours", "הסימולטור על המחשב הזה", "פירוק של 15", formatSeconds(seconds), "זמן אמיתי שנמדד עכשיו. זה חיקוי, לא מחשב קוונטי."],
    ["quantum", "מחשב קוונטי עתידי עם שור", "מפתח של 2048 סיביות", "כ־8 שעות", "אומדן מ-2021, עם כ-20 מיליון קיוביטים. אומדן מ-2025: פחות משבוע."],
    ["classical", "מחשב רגיל", "אותו מפתח של 2048 סיביות", "כ־10 בחזקת 15 שנים", "אומדן לפי GNFS, הנפה הכללית של שדות מספרים. בערך פי 70,000 מגיל היקום."],
  ];
  rows.forEach(([kind, title, subtitle, time, note]) => {
    const card = document.createElement("article");
    card.className = `compare-card ${kind}`;
    const heading = document.createElement("h3");
    heading.textContent = title;
    const sub = document.createElement("p");
    sub.className = "hint";
    sub.textContent = subtitle;
    const strong = document.createElement("strong");
    strong.textContent = time;
    const detail = document.createElement("p");
    detail.textContent = note;
    card.append(heading, sub, strong, detail);
    compare.appendChild(card);
  });
}

function formatSeconds(seconds) {
  return `${seconds.toLocaleString("he-IL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} שניות`;
}

function openModal(title, code) {
  modalTitle.textContent = title;
  modalCode.textContent = code;
  modal.hidden = false;
  document.querySelector("#modal-close").focus();
}

function closeModal() {
  modal.hidden = true;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");
  resetLaterSteps();
  const text = messageBox.value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n/g, " ");
  encryptBtn.disabled = true;
  try {
    const data = await postJson("/api/encrypt", { text });
    sentText = text;
    cipherDigits = data.digits;
    pythonCode = data.python_code;
    renderWalkthrough(data.characters[0]);
    renderCipher(data.characters);
    afterEncrypt.hidden = false;
    document.querySelector("#explain-rsa").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    showError(error.message || "אין קשר לשרת המקומי.");
  } finally {
    encryptBtn.disabled = false;
  }
});

classicalBtn.addEventListener("click", () => {
  classicalBtn.disabled = true;
  classicalSim.hidden = false;
  classicalResult.hidden = true;
  let attempts = 0;
  classicalStatus.textContent = "הדמיה: מחשב רגיל מתחיל לחפש גורמים של מפתח ענק. כמעט ולא זזים.";
  classicalTimer = setInterval(() => {
    attempts += Math.floor(Math.random() * 400_000_000) + 80_000_000;
    classicalAttempts.textContent = attempts.toLocaleString("he-IL");
    classicalBar.style.width = "4%";
  }, 180);
  window.setTimeout(() => {
    clearInterval(classicalTimer);
    classicalTimer = null;
    classicalStatus.textContent = "עצרנו את ההדמיה. במפתח אמיתי החיפוש היה עדיין בהתחלה.";
    classicalResult.hidden = false;
    shorBtn.disabled = false;
    shorHint.hidden = true;
  }, 4200);
});

shorBtn.addEventListener("click", async () => {
  showError("");
  shorBtn.disabled = true;
  shorStatus.hidden = false;
  afterShor.hidden = true;
  try {
    const data = await postJson("/api/shor", { digits: cipherDigits });
    if (data.plaintext !== sentText) {
      throw new Error("הפענוח לא החזיר את ההודעה המקורית. אפשר לנסות שוב.");
    }
    qiskitCode = data.qiskit_code;
    renderStory(data);
    recovered.textContent = data.plaintext;
    renderCompare(data.elapsed_seconds);
    afterShor.hidden = false;
    document.querySelector("#explain-shor").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    showError(error.message || "הסימולטור לא הסתיים.");
    shorBtn.disabled = false;
  } finally {
    shorStatus.hidden = true;
  }
});

document.querySelector("#show-python").addEventListener("click", () => {
  openModal("קוד פייתון: ההצפנה", pythonCode);
});

document.querySelector("#show-qiskit").addEventListener("click", () => {
  openModal("קוד Qiskit: אלגוריתם שור", qiskitCode);
});

document.querySelector("#modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target.dataset.close === "true") closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});

document.querySelector("#reset-btn").addEventListener("click", () => {
  resetLaterSteps();
  showError("");
  document.querySelector("#compose").scrollIntoView({ behavior: "smooth", block: "start" });
  messageBox.focus();
});

messageBox.addEventListener("input", updateCount);
updateCount();
