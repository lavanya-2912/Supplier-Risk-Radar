import httpx
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.config import settings

logger = logging.getLogger("hindsight_service")

class HindsightService:
    """
    Hindsight Cloud API integration service.
    Provides persistent memory layer (Retain, Recall, Reflect) for supplier history.
    Includes robust error handling and fallback when Hindsight Cloud is offline or key is missing.
    """

    def __init__(self):
        self.base_url = settings.HINDSIGHT_API_URL.rstrip('/')
        self.api_key = settings.HINDSIGHT_API_KEY
        self.bank_id = settings.HINDSIGHT_BANK_ID
        self.local_memory_fallback: List[Dict[str, Any]] = []

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json"
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    async def check_health(self) -> Dict[str, Any]:
        """Check connection to Hindsight Cloud and ensure memory bank exists."""
        if not self.is_configured():
            return {
                "status": "FALLBACK_MODE",
                "message": "Hindsight API key not set. Operating in local structured memory fallback mode.",
                "connected": False
            }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"{self.base_url}/banks/{self.bank_id}",
                    headers=self._get_headers()
                )
                if response.status_code == 200:
                    return {
                        "status": "CONNECTED",
                        "message": f"Successfully connected to Hindsight Cloud bank '{self.bank_id}'",
                        "connected": True
                    }
                elif response.status_code == 404:
                    # Bank doesn't exist, attempt to initialize it
                    init_res = await self.create_memory_bank()
                    return init_res
                else:
                    return {
                        "status": "DEGRADED",
                        "message": f"Hindsight HTTP status {response.status_code}",
                        "connected": False
                    }
        except Exception as e:
            logger.warning(f"Hindsight health check failed: {e}")
            return {
                "status": "FALLBACK_MODE",
                "message": f"Hindsight Cloud unreachable ({str(e)}). Using local memory fallback.",
                "connected": False
            }

    async def create_memory_bank(self) -> Dict[str, Any]:
        """Initialize supplier risk memory bank in Hindsight."""
        if not self.is_configured():
            return {"status": "FALLBACK_MODE", "created": False}

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                payload = {
                    "bank_id": self.bank_id,
                    "description": "Supplier Risk Radar intelligent persistent memory store for supplier performance, quality, price creep, and news history."
                }
                response = await client.post(
                    f"{self.base_url}/banks",
                    json=payload,
                    headers=self._get_headers()
                )
                if response.status_code in (200, 201):
                    return {"status": "CONNECTED", "message": "Memory bank created", "created": True}
        except Exception as e:
            logger.error(f"Failed to create Hindsight memory bank: {e}")
        
        return {"status": "FALLBACK_MODE", "message": "Could not create memory bank, fallback active", "created": False}

    async def retain(self, supplier_id: int, supplier_name: str, event_type: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Retain a memory event in Hindsight Cloud.
        event_type: "Supplier Creation", "Delivery Delay", "Quality Incident", "Price Change", "News Signal", "Risk Assessment", "Prediction"
        """
        timestamp = datetime.utcnow().isoformat()
        memory_payload = {
            "supplier_id": supplier_id,
            "supplier_name": supplier_name,
            "event_type": event_type,
            "text": f"Supplier: {supplier_name} (ID: {supplier_id}) | Event: {event_type} | {content} | Date: {timestamp}",
            "metadata": {
                "supplier_id": supplier_id,
                "supplier_name": supplier_name,
                "event_type": event_type,
                "timestamp": timestamp,
                **(metadata or {})
            }
        }

        # Store in local fallback memory cache
        self.local_memory_fallback.append(memory_payload)

        if not self.is_configured():
            logger.info(f"[Hindsight Fallback Retain] {supplier_name} - {event_type}")
            return True

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    f"{self.base_url}/banks/{self.bank_id}/retain",
                    json={
                        "text": memory_payload["text"],
                        "metadata": memory_payload["metadata"]
                    },
                    headers=self._get_headers()
                )
                if response.status_code in (200, 201):
                    logger.info(f"[Hindsight Retain Success] {supplier_name} - {event_type}")
                    return True
                else:
                    logger.warning(f"Hindsight retain returned HTTP {response.status_code}: {response.text}")
        except Exception as e:
            logger.warning(f"Hindsight retain call failed: {e}. Event stored in local fallback cache.")

        return True

    async def recall(self, supplier_id: Optional[int] = None, supplier_name: Optional[str] = None, query: str = "", limit: int = 10) -> List[Dict[str, Any]]:
        """
        Recall supplier memories from Hindsight Cloud or local fallback memory store.
        """
        memories = []

        if self.is_configured():
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    req_payload = {
                        "query": query or (f"Supplier {supplier_name} performance risk delivery quality history" if supplier_name else "Supplier history"),
                        "limit": limit
                    }
                    if supplier_id:
                        req_payload["filter"] = {"supplier_id": supplier_id}

                    response = await client.post(
                        f"{self.base_url}/banks/{self.bank_id}/recall",
                        json=req_payload,
                        headers=self._get_headers()
                    )
                    if response.status_code == 200:
                        data = response.json()
                        results = data.get("memories") or data.get("results") or []
                        for item in results:
                            text = item.get("text") or item.get("content") or str(item)
                            meta = item.get("metadata") or {}
                            memories.append({
                                "text": text,
                                "event_type": meta.get("event_type", "Historical Memory"),
                                "timestamp": meta.get("timestamp", datetime.utcnow().isoformat()),
                                "supplier_id": meta.get("supplier_id", supplier_id),
                                "source": "Hindsight Cloud"
                            })
                        if memories:
                            return memories
            except Exception as e:
                logger.warning(f"Hindsight recall API failed: {e}. Falling back to local memory store.")

        # Local Fallback Search
        filtered = []
        for mem in self.local_memory_fallback:
            if supplier_id and mem["supplier_id"] != supplier_id:
                continue
            if supplier_name and supplier_name.lower() not in mem["supplier_name"].lower():
                continue
            if query and query.lower() not in mem["text"].lower() and query.lower() not in mem["event_type"].lower():
                continue
            filtered.append({
                "text": mem["text"],
                "event_type": mem["event_type"],
                "timestamp": mem["metadata"].get("timestamp", datetime.utcnow().isoformat()),
                "supplier_id": mem["supplier_id"],
                "source": "Structured Local Memory Store"
            })

        return filtered[:limit]

hindsight_service = HindsightService()
