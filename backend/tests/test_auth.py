import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    # 1. Register
    reg_payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
    }
    res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 201
    user_data = res.json()
    assert user_data["email"] == "test@example.com"
    assert user_data["name"] == "Test User"
    assert "id" in user_data

    # 2. Duplicate registration
    res_dup = await client.post("/api/v1/auth/register", json=reg_payload)
    assert res_dup.status_code == 409

    # 3. Wrong password
    login_wrong = {
        "email": "test@example.com",
        "password": "WrongPassword!",
    }
    res_wrong = await client.post("/api/v1/auth/login", json=login_wrong)
    assert res_wrong.status_code == 401

    # 4. Correct login
    login_payload = {
        "email": "test@example.com",
        "password": "Password123!",
    }
    res_login = await client.post("/api/v1/auth/login", json=login_payload)
    assert res_login.status_code == 200
    token_data = res_login.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data

    # 5. Refresh token
    res_refresh = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": token_data["refresh_token"]}
    )
    assert res_refresh.status_code == 200
    new_tokens = res_refresh.json()
    assert "access_token" in new_tokens
    assert new_tokens["refresh_token"] != token_data["refresh_token"]

    # 6. Logout
    res_logout = await client.post(
        "/api/v1/auth/logout", json={"refresh_token": new_tokens["refresh_token"]}
    )
    assert res_logout.status_code == 200
