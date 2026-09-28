import os
import requests
import json
from typing import Dict, Any, Optional
from app.config import settings

class SupabaseService:
    def __init__(self):
        self.url = settings.SUPABASE_URL.rstrip("/")
        self.key = settings.SUPABASE_ANON_KEY
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        self.is_connected = False
        self._check_initial_health()

    def _check_initial_health(self):
        try:
            resp = requests.get(f"{self.url}/auth/v1/health", headers=self.headers, timeout=4)
            self.is_connected = (resp.status_code == 200)
        except Exception:
            self.is_connected = False

    def ping(self) -> Dict[str, Any]:
        """Test live connection to Supabase instance"""
        try:
            resp = requests.get(f"{self.url}/auth/v1/health", headers=self.headers, timeout=3)
            if resp.status_code == 200:
                self.is_connected = True
                return {
                    "connected": True,
                    "url": self.url,
                    "project_ref": self.url.split("//")[-1].split(".")[0],
                    "status": "online",
                    "mode": "cloud_active"
                }
        except Exception as e:
            self.is_connected = False
            return {
                "connected": False,
                "url": self.url,
                "status": "offline",
                "error": str(e)
            }
        self.is_connected = False
        return {
            "connected": False,
            "url": self.url,
            "status": "error"
        }

    def mirror_upsert(self, table_name: str, record: Dict[str, Any]) -> bool:
        """Asynchronously mirror an upserted record to Supabase"""
        if not self.is_connected:
            # Quick retry check
            status = self.ping()
            if not status.get("connected"):
                return False

        try:
            # Clean record for PostgREST
            clean_rec = {}
            for k, v in record.items():
                if hasattr(v, "isoformat"):
                    clean_rec[k] = v.isoformat()
                elif isinstance(v, (str, int, float, bool)) or v is None:
                    clean_rec[k] = v
                elif isinstance(v, dict) or isinstance(v, list):
                    clean_rec[k] = v

            resp = requests.post(
                f"{self.url}/rest/v1/{table_name}",
                headers=self.headers,
                json=[clean_rec],
                timeout=4
            )
            return resp.status_code in (200, 201)
        except Exception as e:
            print(f"[Supabase Sync] Notice: Mirroring to {table_name} skipped: {e}")
            return False

supabase_service = SupabaseService()
