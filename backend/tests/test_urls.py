import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_url_crud_and_validation(client: AsyncClient):
    # 1. Register and login
    await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Link Manager",
            "email": "links@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
        },
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "links@example.com", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Reject dangerous URL schemes
    res_bad_scheme = await client.post(
        "/api/v1/urls",
        json={"original_url": "javascript:alert(1)"},
        headers=headers,
    )
    assert res_bad_scheme.status_code == 400

    # 3. Reject private IP / loopback (SSRF protection)
    res_loopback = await client.post(
        "/api/v1/urls",
        json={"original_url": "http://127.0.0.1:8080/admin"},
        headers=headers,
    )
    assert res_loopback.status_code == 400

    # 4. Create valid short URL
    create_payload = {
        "original_url": "https://en.wikipedia.org/wiki/URL_shortening",
        "custom_alias": "wiki-url",
        "title": "Wikipedia Article",
        "description": "Article about URL shortening",
    }
    res_create = await client.post("/api/v1/urls", json=create_payload, headers=headers)
    assert res_create.status_code == 201
    data = res_create.json()
    assert data["custom_alias"] == "wiki-url"
    assert data["title"] == "Wikipedia Article"
    url_id = data["id"]

    # 5. Duplicate alias rejection
    res_dup_alias = await client.post(
        "/api/v1/urls",
        json={"original_url": "https://example.com", "custom_alias": "wiki-url"},
        headers=headers,
    )
    assert res_dup_alias.status_code == 409

    # 6. Reserved alias rejection
    res_reserved = await client.post(
        "/api/v1/urls",
        json={"original_url": "https://example.com", "custom_alias": "dashboard"},
        headers=headers,
    )
    assert res_reserved.status_code == 400

    # 7. List user URLs
    res_list = await client.get("/api/v1/urls", headers=headers)
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert list_data["total"] == 1
    assert list_data["items"][0]["id"] == url_id

    # 8. Update URL
    res_update = await client.patch(
        f"/api/v1/urls/{url_id}",
        json={"title": "Updated Title", "is_active": False},
        headers=headers,
    )
    assert res_update.status_code == 200
    assert res_update.json()["title"] == "Updated Title"
    assert res_update.json()["is_active"] is False

    # 9. Delete URL
    res_del = await client.delete(f"/api/v1/urls/{url_id}", headers=headers)
    assert res_del.status_code == 200

    # Verify deleted
    res_get_deleted = await client.get(f"/api/v1/urls/{url_id}", headers=headers)
    assert res_get_deleted.status_code == 404
