"use strict";

// בונה קוד Python מלא של אלגוריתם גרובר לפי מודל המאמר (Khan & Faryad, 2026),
// הכולל את הגאומטריה המדויקת במישור הדו-ממדי, שיקופים, וחישוב איטרציות מיטבי.
function buildQiskitCode(secrets, markedIndex) {
  const secretsList = secrets.map((s) => `    ${JSON.stringify(s)},`).join("\n");

  return `# -*- coding: utf-8 -*-
"""
אלגוריתם גרובר (Grover's Search Algorithm)
לפי מודל המאמר: "Loss of the quadratic speedup in Grover search under local and coherent noise"
(Imama Tul Birrah Khan & Muhammad Faryad, 2026)

הקובץ נוצר אוטומטית מתוך ההדגמה ומיישם את עקרונות המאמר:
1. הכנת סופרפוזיציה אחידה |s> בעזרת שכבת Hadamard (זווית התחלתית sin(alpha) = 1/sqrt(M)).
2. איטרציית גרובר G = V * U_f המורכבת משני שיקופים:
   - אורקל U_f = I - 2|w><w| (שיקוף סביב ציר המצבים הלא-מסומנים |w_perp>).
   - דיפוזיה V = 2|s><s| - I = H^(x n) * U_0 * H^(x n) (שיקוף סביב |s>).
3. כל איטרציה מסובבת את המצב ב-2*alpha במישור הדו-ממדי {|w_perp>, |w>}.
4. עצירה לאחר r_0 איטרציות מיטביות, שבהן הזווית (2*r_0 + 1)*alpha קרובה ביותר ל-pi/2 (90 מעלות).

להרצה:
    pip install qiskit qiskit-aer
    python grover_search.py
"""

import math
import sys

from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

# תמיכה בהדפסת עברית תקינה בחלון הפקודה של Windows
sys.stdout.reconfigure(encoding="utf-8")


# ============================================================
# חלק 1: נתוני החיפוש והמרחב
# ============================================================

SECRETS = [
${secretsList}
]

MARKED_INDEX = ${markedIndex}
N = len(SECRETS)                      # מספר הסודות ברשימה
K = max(1, math.ceil(math.log2(N)))   # מספר הקיוביטים הדרוש (n במאמר)
M = 2 ** K                            # גודל מרחב החיפוש הקוונטי N = 2^n


# ============================================================
# חלק 2: חישוב גאומטרי של הזוויות ומספר האיטרציות המיטבי
# ============================================================

# זווית התחלתית alpha: sin(alpha) = 1 / sqrt(M)
alpha = math.asin(1.0 / math.sqrt(M))

# מספר הסיבובים המיטבי r_0 לפי נוסחת המאמר (משוואה 16):
# (2 * r_0 + 1) * alpha ~= pi / 2  ==>  r_0 ~= (pi / (4 * alpha)) - 0.5
r_0 = max(1, round((math.pi / (4.0 * alpha)) - 0.5))

# הסתברות הצלחה תאורטית נקייה מרעש: sin^2((2*r_0 + 1) * alpha)
theoretical_prob = (math.sin((2 * r_0 + 1) * alpha)) ** 2


# ============================================================
# חלק 3: שער Z מבוקר מרובה (Multi-Controlled Z)
# ============================================================

def multi_controlled_z(circuit, qubits):
  """
  הופך את סימן המצב |11...1> (שיקוף סביב תת-המרחב הניצב ל-|11...1>).
  
  זהו שער MCZ הממומש בעזרת שער MCX כאשר על קיוביט המטרה מופעלים שערי H לפני ואחרי.
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
# חלק 4: האורקל U_f = I - 2|w><w|
# ============================================================

def build_oracle(circuit, marked_index, num_qubits):
  """
  האורקל U_f הופך את הפאזה של המצב המסומן |w> בלבד: U_f|x> = (-1)^f(x) |x>.
  במישור הגאומטרי {|w_perp>, |w>}, זהו שיקוף סביב ציר |w_perp>.
  """
  # הופכים את הביטים שהם 0 במצב המסומן כדי לקבל את המצב |11...1>
  zero_bits = [i for i in range(num_qubits) if ((marked_index >> i) & 1) == 0]

  for i in zero_bits:
      circuit.x(i)

  multi_controlled_z(circuit, list(range(num_qubits)))

  for i in zero_bits:
      circuit.x(i)


# ============================================================
# חלק 5: אופרטור הדיפוזיה V = 2|s><s| - I = H^(x n) U_0 H^(x n)
# ============================================================

def build_diffusion(circuit, num_qubits):
  """
  אופרטור הדיפוזיה V משקף את המצב סביב הסופרפוזיציה האחידה |s>.
  הוא מיושם כשיקוף U_0 = 2|0><0| - I סביב מצב האפס, מוקף בשכבות Hadamard.
  שני השיקופים (U_f ואחריו V) יוצרים יחד סיבוב מדויק של 2*alpha לקראת |w>.
  """
  circuit.h(range(num_qubits))
  circuit.x(range(num_qubits))
  multi_controlled_z(circuit, list(range(num_qubits)))
  circuit.x(range(num_qubits))
  circuit.h(range(num_qubits))


# ============================================================
# חלק 6: בניית המעגל הקוונטי המלא
# ============================================================

def build_grover_circuit(marked_index, num_qubits, iterations):
  circuit = QuantumCircuit(num_qubits, num_qubits)

  # שכבת Hadamard התחלתית להכנת הסופרפוזיציה האחידה |s>
  circuit.h(range(num_qubits))

  # הרצת r_0 איטרציות גרובר (כל אחת כוללת אורקל U_f ודיפוזיה V)
  for _ in range(iterations):
      build_oracle(circuit, marked_index, num_qubits)
      build_diffusion(circuit, num_qubits)

  # מדידת כל הקיוביטים
  circuit.measure(range(num_qubits), range(num_qubits))
  return circuit


# ============================================================
# חלק 7: הרצה במדמה קוונטי וניתוח תוצאות
# ============================================================

def main():
  print("=" * 60)
  print("אלגוריתם גרובר - ניתוח גאומטרי והרצה קוונטית")
  print("=" * 60)
  print(f"כמות הסודות (N): {N}")
  print(f"מרחב המצבים הקוונטי (M = 2^{K}): {M}")
  print(f"מספר הקיוביטים (n): {K}")
  print(f"זווית התחלתית (alpha): {alpha:.4f} רדיאנים ({math.degrees(alpha):.2f} מעלות)")
  print(f"מספר איטרציות מיטבי (r_0): {r_0}")
  print(f"זווית סופית צפויה: {(2 * r_0 + 1) * alpha:.4f} רדיאנים (מטרה: pi/2 ~= {math.pi / 2:.4f})")
  print(f"הסתברות הצלחה תאורטית נקייה: {theoretical_prob:.1%}")
  print(f"הסוד הנכון שאנו מחפשים: '{SECRETS[MARKED_INDEX]}' (אינדקס {MARKED_INDEX})")
  print("-" * 60)

  circuit = build_grover_circuit(MARKED_INDEX, K, r_0)

  if K <= 4:
      print("מבנה המעגל הקוונטי:")
      print(circuit.draw(output="text"))
      print("-" * 60)

  # הרצה בסימולטור Aer עם 1024 מדידות (shots)
  simulator = AerSimulator()
  compiled = transpile(circuit, simulator)
  counts = simulator.run(compiled, shots=1024).result().get_counts()

  best_bits, best_count = max(counts.items(), key=lambda item: item[1])
  found_index = int(best_bits, 2)

  print(f"תוצאה דומיננטית שנמדדה: |{best_bits}> ({best_count} מתוך 1024 מדידות)")
  if found_index < N:
      print(f"הסוד שזוהה: '{SECRETS[found_index]}'")
  else:
      print(f"נמדד מצב עודף (אינדקס {found_index})")

  marked_bits = format(MARKED_INDEX, f"0{K}b")
  empirical_prob = counts.get(marked_bits, 0) / 1024.0
  print(f"הסתברות שנמדדה בפועל: {empirical_prob:.1%}")
  print("=" * 60)


if __name__ == "__main__":
  main()
`;
}
