import secrets
import string

BASE62_ALPHABET = string.ascii_lowercase + string.ascii_uppercase + string.digits

def generate_short_code(length: int = 7) -> str:
    """
    Generate a random collision-resistant Base62 string of specified length.
    Default length of 7 gives 62^7 = 3.52 trillion combinations.
    """
    return "".join(secrets.choice(BASE62_ALPHABET) for _ in range(length))
