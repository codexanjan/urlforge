import asyncio
import random
from datetime import datetime, timedelta
from sqlalchemy import select
from app.database import AsyncSessionLocal, create_tables
from app.models.user import User, UserRole
from app.models.url import URL
from app.models.click import Click
from app.security.passwords import hash_password
from app.analytics.collector import hash_ip

SAMPLE_REFERRERS = ["Direct", "Google", "GitHub", "Twitter / X", "LinkedIn", "Reddit", "Hacker News"]
SAMPLE_DEVICES = ["Desktop", "Mobile", "Tablet", "Bot"]
SAMPLE_BROWSERS = ["Chrome", "Safari", "Firefox", "Edge", "Brave"]
SAMPLE_OS = ["Windows", "macOS", "Linux", "iOS", "Android"]
SAMPLE_COUNTRIES = [
    ("United States", "US"),
    ("Germany", "DE"),
    ("United Kingdom", "GB"),
    ("India", "IN"),
    ("Canada", "CA"),
    ("France", "FR"),
    ("Japan", "JP"),
    ("Australia", "AU"),
]

async def seed_database():
    print("Initializing tables...")
    await create_tables()

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        admin_check = await db.execute(select(User).where(User.email == "admin@urlforge.app"))
        if admin_check.scalar_one_or_none():
            print("Database already seeded. Skipping.")
            return

        print("Seeding users...")
        # 1. Admin user
        admin = User(
            name="Admin User",
            email="admin@urlforge.app",
            password_hash=hash_password("AdminSecurePass123!"),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )
        db.add(admin)

        # 2. Demo developer user
        demo_user = User(
            name="Alex Dev",
            email="alex@urlforge.app",
            password_hash=hash_password("DemoPassword123!"),
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
        )
        db.add(demo_user)
        await db.commit()
        await db.refresh(admin)
        await db.refresh(demo_user)

        print("Seeding URLs...")
        urls_data = [
            {
                "user_id": demo_user.id,
                "original_url": "https://github.com/fastapi/fastapi",
                "short_code": "fastapi",
                "custom_alias": "fastapi",
                "title": "FastAPI Repository",
                "description": "High performance, easy to learn, fast to code Python framework",
                "is_active": True,
                "expires_at": datetime.utcnow() + timedelta(days=180),
            },
            {
                "user_id": demo_user.id,
                "original_url": "https://react.dev/reference/react",
                "short_code": "react-docs",
                "custom_alias": "react-docs",
                "title": "React Documentation",
                "description": "Official React component and hooks reference documentation",
                "is_active": True,
                "expires_at": None,
            },
            {
                "user_id": demo_user.id,
                "original_url": "https://tailwindcss.com/docs/utility-first",
                "short_code": "tailwind",
                "custom_alias": "tailwind",
                "title": "Tailwind CSS Documentation",
                "description": "Rapidly build modern websites without ever leaving your HTML",
                "is_active": True,
                "expires_at": None,
            },
            {
                "user_id": demo_user.id,
                "original_url": "https://news.ycombinator.com",
                "short_code": "hn-daily",
                "custom_alias": "hn-daily",
                "title": "Hacker News Frontpage",
                "description": "Curated technology news, startups, and engineering articles",
                "is_active": False, # Disabled link for testing
                "expires_at": None,
            },
            {
                "user_id": demo_user.id,
                "original_url": "https://example.com/expired-flash-sale",
                "short_code": "flash-sale",
                "custom_alias": "flash-sale",
                "title": "Expired Flash Sale Promo",
                "description": "24 hour flash sale promotion link",
                "is_active": True,
                "expires_at": datetime.utcnow() - timedelta(days=2), # Expired link for testing
            },
        ]

        created_urls = []
        for u in urls_data:
            url_obj = URL(**u)
            db.add(url_obj)
            created_urls.append(url_obj)

        await db.commit()
        for u in created_urls:
            await db.refresh(u)

        print("Seeding click analytics events...")
        # Generate 250 realistic clicks over the past 30 days for created URLs
        now = datetime.utcnow()
        for _ in range(250):
            target_url = random.choice([created_urls[0], created_urls[1], created_urls[2]])
            days_ago = random.randint(0, 29)
            hours_ago = random.randint(0, 23)
            click_time = now - timedelta(days=days_ago, hours=hours_ago)

            dev_type = random.choices(SAMPLE_DEVICES, weights=[55, 35, 7, 3])[0]
            is_bot = dev_type == "Bot"
            browser = "Other" if is_bot else random.choice(SAMPLE_BROWSERS)
            os_name = "Other" if is_bot else random.choice(SAMPLE_OS)
            country, _ = random.choice(SAMPLE_COUNTRIES)

            fake_ip = f"198.51.100.{random.randint(1, 254)}"

            click = Click(
                url_id=target_url.id,
                timestamp=click_time,
                ip_hash=hash_ip(fake_ip),
                user_agent="Mozilla/5.0 (Sample UA)" if not is_bot else "Googlebot/2.1",
                referrer=random.choice(SAMPLE_REFERRERS),
                country=country,
                region="State/Region",
                city="Capital",
                device_type=dev_type,
                browser=browser,
                operating_system=os_name,
                is_bot=is_bot,
            )
            db.add(click)
            target_url.click_count += 1

        await db.commit()
        print("Database seeded successfully with demo users, URLs, and analytics!")

if __name__ == "__main__":
    asyncio.run(seed_database())
