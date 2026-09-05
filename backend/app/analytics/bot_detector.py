import re

KNOWN_BOT_PATTERNS = [
    r"bot",
    r"spider",
    r"crawl",
    r"slurp",
    r"facebookexternalhit",
    r"whatsapp",
    r"twitterbot",
    r"telegrambot",
    r"linkedinbot",
    r"discordbot",
    r"slackbot",
    r"applebot",
    r"pingdom",
    r"uptimerobot",
    r"curl",
    r"wget",
    r"python-requests",
    r"httpx",
    r"aiohttp",
    r"go-http-client",
    r"postmanruntime",
]

_BOT_REGEX = re.compile("|".join(KNOWN_BOT_PATTERNS), re.IGNORECASE)

def is_bot_user_agent(user_agent: str | None) -> bool:
    """
    Check if the user-agent string matches known crawlers, preview bots, or automated scrapers.
    """
    if not user_agent:
        return True # Missing user-agent is typically an automated script
    return bool(_BOT_REGEX.search(user_agent))
