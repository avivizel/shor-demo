"""אלגוריתם שור שמפרק את 15, על סימולטור מקומי.

המעגל הוא זה שמופיע במדריך של IBM למספר 15 עם a = 2:
שערי SWAP להכפלה מודולו 15, ואז התמרת פורייה הפוכה.
אין כאן חיבור ל-IBM Quantum. הכול רץ על AerSimulator.
"""

from fractions import Fraction
from math import gcd
from time import perf_counter

from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister, transpile
from qiskit.circuit.library import QFT
from qiskit_aer import AerSimulator

from rsa_toy import E, N, decrypt_digits, private_exponent

A = 2
SHOTS = 1024
CONTROL_QUBITS = 8
TARGET_QUBITS = 4


def multiply_by_2_mod_15():
    # מכפיל את המספר הרשום בארבעה קיוביטים ב-2, מודולו 15.
    # אלה אותם חילופי SWAP כמו במדריך של IBM.
    circuit = QuantumCircuit(4)
    circuit.swap(2, 3)
    circuit.swap(1, 2)
    circuit.swap(0, 1)
    gate = circuit.to_gate()
    gate.name = "M_2"
    return gate


def multiply_by_4_mod_15():
    # מכפיל את המספר ב-4, מודולו 15.
    circuit = QuantumCircuit(4)
    circuit.swap(1, 3)
    circuit.swap(0, 2)
    gate = circuit.to_gate()
    gate.name = "M_4"
    return gate


def repeated_square(a, k, n):
    # a בחזקת 2^k, מודולו n. מחשבים את זה בריבועים, לא בחזקה ארוכה.
    for _ in range(k):
        a = pow(a, 2, n)
    return a


def build_order_finding_circuit():
    """בונה את המעגל שמוצא את המחזור של 2 מודולו 15."""
    multipliers = [repeated_square(A, k, N) for k in range(CONTROL_QUBITS)]

    control = QuantumRegister(CONTROL_QUBITS, name="C")
    target = QuantumRegister(TARGET_QUBITS, name="T")
    output = ClassicalRegister(CONTROL_QUBITS, name="out")
    circuit = QuantumCircuit(control, target, output)

    # אוגר היעד מתחיל ב-|1>, כי משם יוצא המחזור.
    circuit.x(CONTROL_QUBITS)

    for k, qubit in enumerate(control):
        circuit.h(k)
        multiplier = multipliers[k]
        if multiplier == 2:
            gate = multiply_by_2_mod_15().control()
            circuit.compose(gate, qubits=[qubit, *list(target)], inplace=True)
        elif multiplier == 4:
            gate = multiply_by_4_mod_15().control()
            circuit.compose(gate, qubits=[qubit, *list(target)], inplace=True)
        # מכפיל 1 לא משנה את המספר, אז אין שער.

    # התמרת פורייה הפוכה הופכת את המחזור למספר שאפשר למדוד.
    fourier = QFT(CONTROL_QUBITS, inverse=True)
    circuit.compose(fourier, qubits=control, inplace=True)
    circuit.measure(control, output)
    return circuit


def _phase_label(phase, fraction):
    if phase == 0:
        return "0"
    return f"{fraction.numerator}/{fraction.denominator}"


def _why(phase, r, success):
    if phase == 0:
        return "המדידה יצאה 0. ממנה אי אפשר ללמוד את המחזור."
    if r % 2 != 0:
        return f"הניחוש למחזור הוא {r}, והוא אי-זוגי. בשיטה הזו צריך מחזור זוגי."
    if pow(A, r, N) != 1:
        return f"הניחוש {r} אינו המחזור של 2 בחלוקה ב-15."
    if success:
        return f"המחזור {r} זוגי, וממנו יצאו הגורמים."
    return "המחזור הזה לא נתן גורם חדש."


def _factor_from_order(r):
    """אם r מחזור זוגי אמיתי, מחזיר גורם של 15. אחרת None."""
    if r % 2 != 0 or pow(A, r, N) != 1:
        return None
    half_power = pow(A, r // 2, N)
    for delta in (-1, 1):
        partner = half_power + delta
        factor = gcd(partner, N)
        if 1 < factor < N:
            return {
                "factor": factor,
                "other": N // factor,
                "delta": delta,
                "half": r // 2,
                "raw_power": A ** (r // 2),
                "partner": A ** (r // 2) + delta,
            }
    return None


def _read_counts(counts):
    """עובר על המדידות החזקות עד שמוצא גורם."""
    ordered = sorted(counts.items(), key=lambda item: item[1], reverse=True)
    threshold = max(counts.values()) * 0.1
    peaks = [(bits, count) for bits, count in ordered if count >= threshold]
    scan = peaks or ordered[:6]

    story = []
    found = None
    winning_r = None
    winning_phase = None
    for bitstring, count in scan:
        phase = int(bitstring, 2) / (2**CONTROL_QUBITS)
        fraction = Fraction(phase).limit_denominator(N)
        r = fraction.denominator
        factors = _factor_from_order(r)
        success = factors is not None
        story.append(
            {
                "phase": _phase_label(phase, fraction),
                "r": r,
                "count": int(count),
                "success": success,
                "why": _why(phase, r, success),
            }
        )
        if success:
            found = factors
            winning_r = r
            winning_phase = _phase_label(phase, fraction)
            break

    if found is None:
        for bitstring, count in ordered:
            phase = int(bitstring, 2) / (2**CONTROL_QUBITS)
            fraction = Fraction(phase).limit_denominator(N)
            factors = _factor_from_order(fraction.denominator)
            if factors is not None:
                found = factors
                winning_r = fraction.denominator
                winning_phase = _phase_label(phase, fraction)
                story.append(
                    {
                        "phase": winning_phase,
                        "r": winning_r,
                        "count": int(count),
                        "success": True,
                        "why": _why(phase, winning_r, True),
                    }
                )
                break
    return story, found, winning_r, winning_phase


class ShorFailed(Exception):
    """הסימולטור רץ, אבל המדידות לא נתנו גורם."""


def run_shor(digits, shots=SHOTS):
    """מריץ את שור, מחשב את המפתח הסודי, ופותח את הספרות."""
    started = perf_counter()
    circuit = build_order_finding_circuit()
    simulator = AerSimulator(seed_simulator=15)
    run_circuit = transpile(circuit, simulator)
    job = simulator.run(run_circuit, shots=shots)
    counts = job.result().get_counts()
    story, found, r, phase = _read_counts(counts)
    elapsed = perf_counter() - started

    if found is None:
        raise ShorFailed("הסימולטור לא מצא גורם הפעם. אפשר לנסות שוב.")

    p, q = sorted((found["factor"], found["other"]))
    d, phi = private_exponent(p, q, E)
    plaintext = decrypt_digits(digits, d, N)

    return {
        "plaintext": plaintext,
        "p": p,
        "q": q,
        "r": r,
        "phase": phase,
        "d": d,
        "phi": phi,
        "e": E,
        "n": N,
        "a": A,
        "half": found["half"],
        "raw_power": found["raw_power"],
        "delta": found["delta"],
        "partner": found["partner"],
        "found_factor": found["factor"],
        "other_factor": found["other"],
        "elapsed_seconds": elapsed,
        "shots": shots,
        "control_qubits": CONTROL_QUBITS,
        "target_qubits": TARGET_QUBITS,
        "attempts": story,
    }
