import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_rate_limiting(client: AsyncClient):
    # Registration rate limit is set to 3 per minute
    reg_payload = lambda i: {
        "name": f"User {i}",
        "email": f"rate_limit_{i}@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
    }

    # First 3 should succeed
    for i in range(3):
        res = await client.post("/api/v1/auth/register", json=reg_payload(i))
        assert res.status_code == 201

    # 4th request should trigger 429
    res_limited = await client.post("/api/v1/auth/register", json=reg_payload(4))
    assert res_limited.status_code == 429
    assert "Retry-After" in res_limited.headers
    assert res_limited.json()["error"]["code"] == "RATE_LIMITED"
