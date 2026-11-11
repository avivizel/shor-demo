"""הצפנת RSA צעצוע להודעה בעברית.

המפתח ציבורי קטן בכוונה: N = 15 ו-e = 3.
כל תו הופך לשתי ספרות, וכל ספרה מוצפנת לבד,
כי RSA מצפין רק מספר שקטן מ-N.
"""

N = 15
E = 3

# רווח, 22 אותיות, 5 אותיות סופיות, פיסוק וספרות.
# המקום של ש הוא 21: רווח הוא 0, א היא 1, וכן הלאה.
ALPHABET = " אבגדהוזחטיכלמנסעפצקרשתךםןףץ.,!?0123456789"

assert ALPHABET.index("א") == 1
assert ALPHABET.index("ש") == 21
assert ALPHABET[0] == " "


class ToyRsaError(Exception):
    """שגיאה שאפשר להציג לתלמיד כמו שהיא."""


def encrypt_digit(digit, e=E, n=N):
    # שארית של הספרה בחזקת e, בחלוקה ב-N.
    return pow(digit, e, n)


def encrypt_message(text):
    """מצפין הודעה. מחזיר את הספרות המוצפנות ופירוט לכל תו."""
    cleaned = text.replace("\r\n", "\n").replace("\r", "\n").replace("\n", " ")
    if not cleaned.strip():
        raise ToyRsaError("כתבו הודעה בעברית קודם.")
    if len(cleaned) > 120:
        raise ToyRsaError("אפשר עד 120 תווים בדף הזה.")

    characters = []
    for char in cleaned:
        if char not in ALPHABET:
            raise ToyRsaError(
                f"אי אפשר להצפין את התו „{char}”. "
                "אפשר אותיות בעברית, גם סופיות, רווח, ספרות, "
                "ואת הסימנים . , ! ?"
            )
        index = ALPHABET.index(char)
        tens, ones = divmod(index, 10)
        characters.append(
            {
                "char": char,
                "index": index,
                "digits": [tens, ones],
                "powers": [tens**E, ones**E],
                "cipher": [encrypt_digit(tens), encrypt_digit(ones)],
            }
        )

    return {
        "n": N,
        "e": E,
        "characters": characters,
        "digits": [digit for item in characters for digit in item["cipher"]],
    }


def decrypt_digits(digits, d, n=N):
    """פותח זוגות של ספרות מוצפנות בעזרת המפתח הסודי d."""
    if len(digits) % 2 != 0:
        raise ToyRsaError("ההודעה המוצפנת פגומה.")

    chars = []
    for start in range(0, len(digits), 2):
        tens = pow(int(digits[start]), d, n)
        ones = pow(int(digits[start + 1]), d, n)
        if tens > 9 or ones > 9:
            raise ToyRsaError("פענוח הספרות נכשל.")
        index = tens * 10 + ones
        if index >= len(ALPHABET):
            raise ToyRsaError("פענוח האותיות נכשל.")
        chars.append(ALPHABET[index])
    return "".join(chars)


def private_exponent(p, q, e=E):
    """מחשב את d מתוך שני הגורמים. זה השלב הקלאסי שאחרי שור."""
    phi = (p - 1) * (q - 1)
    return pow(e, -1, phi), phi
