"""
Nima Desktop — HTTP API Client Layer.
A singleton wrapper around `requests` that talks to the NimaPOS FastAPI backend.
Usage:
    from nima_desktop.api_client import api
    products = api.get("/products")
"""
import requests
from typing import Any, Optional

class NimaApiClient:
    BASE_URL = "http://127.0.0.1:8000/api/v1"

    def __init__(self):
        self._token: Optional[str] = None
        self._session = requests.Session()

    # ------------------------------------------------------------------ auth --
    def login(self, username: str, password: str) -> bool:
        """Authenticate and cache JWT token. Returns True on success."""
        try:
            resp = self._session.post(
                f"{self.BASE_URL}/auth/token",
                data={"username": username, "password": password},
                timeout=5,
            )
            if resp.status_code == 200:
                self._token = resp.json().get("access_token")
                self._session.headers.update({"Authorization": f"Bearer {self._token}"})
                return True
        except requests.exceptions.ConnectionError:
            pass
        return False

    # -------------------------------------------------------------- generics --
    def get(self, path: str, params: dict = None) -> Any:
        try:
            resp = self._session.get(f"{self.BASE_URL}{path}", params=params, timeout=5)
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            print(f"[API GET ERROR] {path}: {exc}")
            return None

    def post(self, path: str, json: dict = None) -> Any:
        try:
            resp = self._session.post(f"{self.BASE_URL}{path}", json=json, timeout=5)
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            print(f"[API POST ERROR] {path}: {exc}")
            return None

    def put(self, path: str, json: dict = None) -> Any:
        try:
            resp = self._session.put(f"{self.BASE_URL}{path}", json=json, timeout=5)
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            print(f"[API PUT ERROR] {path}: {exc}")
            return None

    def delete(self, path: str) -> bool:
        try:
            resp = self._session.delete(f"{self.BASE_URL}{path}", timeout=5)
            resp.raise_for_status()
            return True
        except Exception as exc:
            print(f"[API DELETE ERROR] {path}: {exc}")
            return False

# Singleton instance — import `api` everywhere
api = NimaApiClient()
