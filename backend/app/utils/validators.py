import ipaddress
import re
from urllib.parse import urlparse, urlunparse
from typing import Tuple

RESERVED_ALIASES = {
    "admin",
    "api",
    "login",
    "register",
    "dashboard",
    "settings",
    "analytics",
    "help",
    "about",
    "favicon",
    "favicon.ico",
    "favicon.svg",
    "robots.txt",
    "sitemap.xml",
    "health",
    "report",
    "privacy",
    "terms",
    "docs",
    "redoc",
    "openapi.json",
    "links",
    "static",
    "assets",
    "auth",
}

BLOCKED_DOMAINS = {
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "example-malware.com",
    "phishing-test-domain.net",
}

def is_private_or_loopback(host: str) -> bool:
    """Check if host is a private or loopback IP address"""
    try:
        ip = ipaddress.ip_address(host)
        return ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local
    except ValueError:
        return False

def validate_and_normalize_url(url_str: str) -> Tuple[bool, str, str]:
    """
    Validates and normalizes target URL.
    Returns: (is_valid, normalized_url_or_empty, error_message_or_empty)
    """
    if not url_str:
        return False, "", "URL cannot be empty."

    url_str = url_str.strip()

    # Prepend https:// if no scheme is specified
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", url_str):
        url_str = "https://" + url_str

    try:
        parsed = urlparse(url_str)
    except Exception:
        return False, "", "Malformed URL."

    # Validate scheme
    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https"):
        return False, "", f"Scheme '{scheme}' is not allowed. Only HTTP and HTTPS are supported."

    # Validate hostname
    hostname = parsed.hostname
    if not hostname:
        return False, "", "URL must contain a valid domain name."

    hostname_lower = hostname.lower()

    # Check blocked domain or localhost/loopback
    if hostname_lower in BLOCKED_DOMAINS or hostname_lower.endswith(".local") or hostname_lower.endswith(".internal"):
        return False, "", "URL cannot target internal, loopback, or blocked domains."

    if is_private_or_loopback(hostname_lower):
        return False, "", "URL cannot target private or local network IP addresses."

    # Check for basic valid domain format
    if "." not in hostname_lower and hostname_lower != "localhost":
        return False, "", "URL domain must be a valid fully qualified domain."

    # Reconstruct normalized URL
    netloc = hostname_lower
    if parsed.port:
        if (scheme == "http" and parsed.port != 80) or (scheme == "https" and parsed.port != 443):
            netloc = f"{netloc}:{parsed.port}"

    path = parsed.path or "/"
    # Clean up double slashes in path
    path = re.sub(r"/+", "/", path)

    normalized = urlunparse((
        scheme,
        netloc,
        path,
        parsed.params,
        parsed.query,
        parsed.fragment
    ))

    return True, normalized, ""

def validate_custom_alias(alias: str) -> Tuple[bool, str]:
    """
    Validate user-requested custom alias.
    Returns: (is_valid, error_message_or_empty)
    """
    if not alias:
        return True, ""

    alias = alias.strip().lower()

    if len(alias) < 3 or len(alias) > 32:
        return False, "Custom alias must be between 3 and 32 characters."

    if not re.match(r"^[a-zA-Z0-9_-]+$", alias):
        return False, "Custom alias may only contain letters, numbers, hyphens, and underscores."

    if alias in RESERVED_ALIASES:
        return False, f"The alias '{alias}' is a reserved system path and cannot be used."

    return True, ""
