import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_api_keys(client: AsyncClient):
    # 1. Register and login
    await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Dev User",
            "email": "dev@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
        },
    )
    login_res = await client.post(
        "/api/v1/auth/login", json={"email": "dev@example.com", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]
    jwt_headers = {"Authorization": f"Bearer {token}"}

    # 2. Create API key
    res_create_key = await client.post(
        "/api/v1/api-keys",
        json={"name": "Production CI"},
        headers=jwt_headers,
    )
    assert res_create_key.status_code == 201
    key_data = res_create_key.json()
    assert "key" in key_data
    assert key_data["key"].startswith("uf_live_")
    raw_api_key = key_data["key"]
    key_id = key_data["id"]

    # 3. Use API key to fetch profile
    api_headers = {"X-API-Key": raw_api_key}
    res_profile = await client.get("/api/v1/me", headers=api_headers)
    assert res_profile.status_code == 200
    assert res_profile.json()["email"] == "dev@example.com"

    # 4. Revoke API key
    res_revoke = await client.delete(f"/api/v1/api-keys/{key_id}", headers=jwt_headers)
    assert res_revoke.status_code == 200

    # 5. Verify revoked API key is rejected
    res_revoked_try = await client.get("/api/v1/me", headers=api_headers)
    assert res_revoked_try.status_code == 401
