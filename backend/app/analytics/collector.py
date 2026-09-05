import hashlib
from datetime import datetime
from typing import Optional
from user_agents import parse as parse_user_agent
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from app.models.click import Click
from app.models.url import URL
from app.analytics.bot_detector import is_bot_user_agent
import logging

logger = logging.getLogger(__name__)

def hash_ip(ip_address: Optional[str]) -> Optional[str]:
    """Privacy-first salt-less anonymization of IP address"""
    if not ip_address:
        return None
    # Use SHA-256 to hash IP
    return hashlib.sha256(ip_address.encode()).hexdigest()[:32]

def normalize_referrer(referrer: Optional[str]) -> Optional[str]:
    if not referrer:
        return "Direct"
    ref_lower = referrer.lower()
    if "google." in ref_lower:
        return "Google"
    elif "github.com" in ref_lower:
        return "GitHub"
    elif "twitter.com" in ref_lower or "t.co" in ref_lower or "x.com" in ref_lower:
        return "Twitter / X"
    elif "linkedin.com" in ref_lower:
        return "LinkedIn"
    elif "facebook.com" in ref_lower:
        return "Facebook"
    elif "instagram.com" in ref_lower:
        return "Instagram"
    elif "reddit.com" in ref_lower:
        return "Reddit"
    elif "youtube.com" in ref_lower:
        return "YouTube"
    elif "duckduckgo.com" in ref_lower:
        return "DuckDuckGo"
    else:
        # Extract hostname if possible
        try:
            from urllib.parse import urlparse
            parsed = urlparse(referrer)
            if parsed.netloc:
                return parsed.netloc
        except Exception:
            pass
        return referrer[:100]

def parse_client_metadata(user_agent_str: Optional[str]):
    """Extract device_type, browser, and operating_system from user agent"""
    if not user_agent_str:
        return "Other", "Other", "Other", False

    is_bot = is_bot_user_agent(user_agent_str)

    try:
        ua = parse_user_agent(user_agent_str)
        
        # Device
        if is_bot or ua.is_bot:
            device_type = "Bot"
            is_bot = True
        elif ua.is_mobile:
            device_type = "Mobile"
        elif ua.is_tablet:
            device_type = "Tablet"
        elif ua.is_pc:
            device_type = "Desktop"
        else:
            device_type = "Other"

        # Browser
        browser_family = ua.browser.family or "Other"
        if "Chrome" in browser_family:
            browser = "Chrome"
        elif "Firefox" in browser_family:
            browser = "Firefox"
        elif "Safari" in browser_family:
            browser = "Safari"
        elif "Edge" in browser_family:
            browser = "Edge"
        elif "Opera" in browser_family:
            browser = "Opera"
        else:
            browser = browser_family if browser_family != "Other" else "Other"

        # OS
        os_family = ua.os.family or "Other"
        if "Windows" in os_family:
            os_name = "Windows"
        elif "Mac" in os_family or "iOS" in os_family:
            os_name = "macOS" if not ua.is_mobile else "iOS"
        elif "Android" in os_family:
            os_name = "Android"
        elif "Linux" in os_family:
            os_name = "Linux"
        else:
            os_name = os_family if os_family != "Other" else "Other"

        return device_type, browser, os_name, is_bot
    except Exception as e:
        logger.warning(f"Error parsing user agent: {e}")
        return "Other", "Other", "Other", is_bot

async def record_click_event(
    db: AsyncSession,
    url_id: str,
    ip_address: Optional[str],
    user_agent_str: Optional[str],
    raw_referrer: Optional[str],
    country: Optional[str] = None,
    region: Optional[str] = None,
    city: Optional[str] = None,
):
    """
    Persist click record and increment total click count for URL.
    """
    try:
        device_type, browser, os_name, is_bot = parse_client_metadata(user_agent_str)
        ip_hashed = hash_ip(ip_address)
        referrer_clean = normalize_referrer(raw_referrer)

        click = Click(
            url_id=url_id,
            timestamp=datetime.utcnow(),
            ip_hash=ip_hashed,
            user_agent=user_agent_str[:500] if user_agent_str else None,
            referrer=referrer_clean,
            country=country,
            region=region,
            city=city,
            device_type=device_type,
            browser=browser,
            operating_system=os_name,
            is_bot=is_bot,
        )
        db.add(click)

        # Increment URL click count
        await db.execute(
            update(URL).where(URL.id == url_id).values(click_count=URL.click_count + 1)
        )
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to record click event: {e}")
        await db.rollback()
