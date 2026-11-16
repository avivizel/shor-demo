"use strict";

// בונה קוד Python מלא של אלגוריתם גרובר, לפי רשימת הסודות והסוד שנבחר באתר.
function buildQiskitCode(secrets, markedIndex) {
  const secretsList = secrets.map((s) => `    ${JSON.stringify(s)},`).join("\n");

  return `# -*- coding: utf-8 -*-
"""
אלגוריתם גרובר: מציאת סוד אחד מתוך רשימה בעזרת מחשב קוונטי מדומה.

הקובץ נוצר אוטומטית מתוך ההדגמה באתר, והוא כולל את הרשימה שבחרתם
ואת הסוד שבחרתם לחפש.

להרצה:
    pip install qiskit qiskit-aer
    python grover_search.py
"""

import math
import sys

from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

# שורה זו גורמת לעברית להופיע נכון גם בחלון הפקודה של Windows
sys.stdout.reconfigure(encoding="utf-8")


# ============================================================
# חלק 1: הנתונים
# ============================================================

# רשימת כל הסודות. המספר של כל סוד הוא המיקום שלו ברשימה (מ-0 ואילך)
SECRETS = [
${secretsList}
]

# המיקום של הסוד שבחרתם. זה הסוד הנכון שאנחנו מחפשים
MARKED_INDEX = ${markedIndex}


# ============================================================
# חלק 2: כמה קיוביטים צריך?
# ============================================================

N = len(SECRETS)                      # כמות הסודות
K = max(1, math.ceil(math.log2(N)))   # מספר הקיוביטים
M = 2 ** K                            # מספר המצבים שהקיוביטים מסוגלים לתאר

# קיוביט אחד יכול להיות 0 או 1. K קיוביטים יכולים לתאר 2^K מספרים.
# למשל: 3 קיוביטים מתארים את המספרים 0 עד 7.
# אם N אינו חזקה של 2, נשארים מצבים "עודפים" שאינם סוד ברשימה.


# ============================================================
# חלק 3: פונקציית עזר לשער "שליטה-זי"
# ============================================================

def multi_controlled_z(circuit, qubits):
    """
    הופך את סימן המצב רק כשכל הקיוביטים ברשימה הם 1.

    שער Z שווה ל-H, אחריו X, אחריו H. לכן מחליפים את הקיוביט האחרון ב-H,
    מפעילים X מבוקר על כל השאר, ואז H שוב.
    """
    if len(qubits) == 1:
        circuit.z(qubits[0])
    else:
        target = qubits[-1]
        controls = qubits[:-1]
        circuit.h(target)
        circuit.mcx(controls, target)
        circuit.h(target)


# ============================================================
# חלק 4: האורקל (Oracle)
# ============================================================

def build_oracle(circuit, marked_index):
    """
    האורקל הוא "קופסה שחורה" שיודעת איזה סוד הנכון.
    הוא הופך את הסימן של הסוד הנכון, ולא נוגע באחרים.

    טריק: שער X הופך 0 ל-1. אם נהפוך את הביטים של הסוד הנכון שהם 0,
    הסוד הנכון יהיה "כולו 1". אז נהפוך את הסימן בעזרת multi_controlled_z,
    ובסוף נהפוך את הביטים חזרה.
    """
    zero_bits = [i for i in range(K) if ((marked_index >> i) & 1) == 0]

    for i in zero_bits:
        circuit.x(i)

    multi_controlled_z(circuit, list(range(K)))

    for i in zero_bits:
        circuit.x(i)


# ============================================================
# חלק 5: אופרטור הדיפוזיה (Diffusion)
# ============================================================

def build_diffusion(circuit):
    """
    הדיפוזיה מגדילה את הסיכוי של הסוד שהסימן שלו הפוך,
    ומקטינה את הסיכוי של כל השאר. זו ההיפוך סביב הממוצע.

    שלבים: H על כולם, X על כולם, הפיכת הסימן של המצב "כולו 0",
    ואז X על כולם ו-H על כולם שוב.
    """
    circuit.h(range(K))
    circuit.x(range(K))
    multi_controlled_z(circuit, list(range(K)))
    circuit.x(range(K))
    circuit.h(range(K))


# ============================================================
# חלק 6: בניית המעגל הקוונטי המלא
# ============================================================

def build_grover_circuit(marked_index, iterations):
    circuit = QuantumCircuit(K, K)

    # שלב 1: מכינים את כל המצבים באותו משקל. לכל סוד הסתברות שווה.
    circuit.h(range(K))

    # שלב 2: חוזרים על "אורקל ואז דיפוזיה" כמה פעמים שצריך
    for _ in range(iterations):
        build_oracle(circuit, marked_index)
        build_diffusion(circuit)

    # שלב 3: מודדים את הקיוביטים. התוצאה היא מספר של K ביטים
    circuit.measure(range(K), range(K))
    return circuit


# ============================================================
# חלק 7: הרצה
# ============================================================

def main():
    # מספר הסיבובים הטוב ביותר: בערך (π/4) * √M
    iterations = max(1, int((math.pi / 4) * math.sqrt(M)))

    print(f"כמות הסודות: {N}")
    print(f"מספר הקיוביטים: {K}")
    print(f"מספר הסיבובים: {iterations}")
    print(f"הסוד שאנחנו מחפשים: {SECRETS[MARKED_INDEX]}")
    print()

    circuit = build_grover_circuit(MARKED_INDEX, iterations)

    # מציירים את המעגל רק כשהוא קטן מספיק כדי להיות קריא
    if K <= 4:
        print(circuit.draw(output="text"))
        print()

    # מריצים את המעגל על מדמה קוונטי (המחשב שלכם), 1024 פעמים
    simulator = AerSimulator()
    compiled = transpile(circuit, simulator)
    counts = simulator.run(compiled, shots=1024).result().get_counts()

    # התוצאה שנמדדה הכי הרבה פעמים היא הסוד שגרובר מצא
    best_bits, best_count = max(counts.items(), key=lambda item: item[1])
    found_index = int(best_bits, 2)

    print(f"התוצאה הנפוצה ביותר: {best_bits} (נמדדה {best_count} פעמים מתוך 1024)")
    if found_index < N:
        print(f"הסוד שגרובר מצא: {SECRETS[found_index]}")
    else:
        print("המדידה נפלה על מצב עודף שאינו סוד ברשימה")

    marked_bits = format(MARKED_INDEX, f"0{K}b")
    marked_probability = counts.get(marked_bits, 0) / 1024
    print(f"הסיכוי למצוא את הסוד הנכון: {marked_probability:.1%}")


if __name__ == "__main__":
    main()
`;
}
