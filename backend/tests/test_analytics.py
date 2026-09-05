import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_analytics_and_export(client: AsyncClient):
    # 1. Register & login
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Analyst", "email": "analytics@example.com", "password": "Password123!", "confirm_password": "Password123!"},
    )
    login_res = await client.post("/api/v1/auth/login", json={"email": "analytics@example.com", "password": "Password123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create URL
    url_res = await client.post(
        "/api/v1/urls",
        json={"original_url": "https://example.com/tracked", "custom_alias": "track-me"},
        headers=headers,
    )
    url_id = url_res.json()["id"]

    # 3. Simulate clicks with various user agents
    # Chrome click
    await client.get(
        "/track-me",
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"},
        follow_redirects=False,
    )
    # Bot click
    await client.get(
        "/track-me",
        headers={"User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)"},
        follow_redirects=False,
    )

    # 4. Fetch Analytics overview
    res_analytics = await client.get(f"/api/v1/urls/{url_id}/analytics?days=30", headers=headers)
    assert res_analytics.status_code == 200
    analytics_data = res_analytics.json()
    assert "overview" in analytics_data
    assert "timeline" in analytics_data
    assert "devices" in analytics_data

    # 5. Export JSON
    res_json_export = await client.get(f"/api/v1/urls/{url_id}/export?format=json", headers=headers)
    assert res_json_export.status_code == 200
    assert "application/json" in res_json_export.headers["content-type"]

    # 6. Export CSV
    res_csv_export = await client.get(f"/api/v1/urls/{url_id}/export?format=csv", headers=headers)
    assert res_csv_export.status_code == 200
    assert "text/csv" in res_csv_export.headers["content-type"]
    assert "Timestamp,Device,Browser" in res_csv_export.text
