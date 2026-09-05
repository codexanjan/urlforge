import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_redirect_system(client: AsyncClient):
    # 1. Create active link
    res_create = await client.post(
        "/api/v1/urls",
        json={"original_url": "https://example.com/dest", "custom_alias": "go-dest"},
    )
    assert res_create.status_code == 201

    # 2. Redirect active link (HTTP 302, follow_redirects=False)
    res_redirect = await client.get("/go-dest", follow_redirects=False)
    assert res_redirect.status_code == 302
    assert res_redirect.headers["location"] == "https://example.com/dest"

    # 3. Create expired link
    past_date = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    # Create with future, then update to past or create disabled
    res_disabled = await client.post(
        "/api/v1/urls",
        json={"original_url": "https://example.com/disabled", "custom_alias": "disabled-link"},
    )
    url_id = res_disabled.json()["id"]

    # Register user to authenticate update
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Admin", "email": "adm@test.com", "password": "Password123!", "confirm_password": "Password123!"},
    )
    login_res = await client.post("/api/v1/auth/login", json={"email": "adm@test.com", "password": "Password123!"})
    token = login_res.json()["access_token"]

    # Disable link
    await client.patch(
        f"/api/v1/urls/{url_id}",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token}"},
    )

    # 4. Access disabled link
    res_disabled_redirect = await client.get("/disabled-link", follow_redirects=False)
    assert res_disabled_redirect.status_code == 410

    # 5. Access non-existent short code
    res_404 = await client.get("/non-existent-code-12345", follow_redirects=False)
    assert res_404.status_code == 404
