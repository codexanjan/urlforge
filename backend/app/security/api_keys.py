import hashlib
import secrets
from typing import Tuple

API_KEY_PREFIX = "uf_live_"

def generate_api_key() -> Tuple[str, str, str]:
    """
    Generates a secure API key.
    Returns: (full_key, key_prefix, key_hash)
    Example full key: uf_live_a8b9c0d1e2f3g4h5...
    """
    random_part = secrets.token_urlsafe(32)
    full_key = f"{API_KEY_PREFIX}{random_part}"
    prefix = full_key[:15] # e.g. uf_live_abc1234
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()
    return full_key, prefix, key_hash

def hash_api_key(key: str) -> str:
    """Hash API key for lookup"""
    return hashlib.sha256(key.encode()).hexdigest()
