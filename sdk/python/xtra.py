"""
XtraSecurity Python SDK High-Level Developer Client, Hardware Disk Cache, Retries & Auto-Injectors
"""

import os
import sys
import time
import json
import uuid
import platform
import getpass
import hashlib
from typing import Dict, Optional, Any, Callable
from contextlib import contextmanager

from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from openapi_client.api_client import ApiClient
from openapi_client.configuration import Configuration
from openapi_client.api.secrets_api import SecretsApi

class XtraError(Exception):
    """Custom exception for XtraSecurity Python SDK errors."""
    pass

class XtraClient:
    """
    Developer-friendly Python client for XtraSecurity.
    Includes motherboard-bound hardware-encrypted disk caching, exponential retries,
    telemetry hooks, context manager injection, and Django/FastAPI/Flask auto-injectors.
    """

    def __init__(
        self,
        token: Optional[str] = None,
        project_id: Optional[str] = None,
        api_url: Optional[str] = None,
        cache: bool = True,
        cache_ttl: float = 30.0,
        fallback_env: Optional[str] = None,
        offline_disk_cache: bool = True,
        max_retries: int = 3,
        on_telemetry: Optional[Callable[[Dict[str, Any]], None]] = None,
        vault_passphrase: Optional[str] = None,
        workspace_id: Optional[str] = None,
        workspace_passphrase: Optional[str] = None,
        scope: Optional[str] = None
    ):
        self.token = token or os.getenv("XTRA_TOKEN")
        if not self.token:
            raise XtraError("XtraSecurity API token is required. Pass token or set XTRA_TOKEN environment variable.")

        self.project_id = project_id or os.getenv("XTRA_PROJECT_ID")
        self.workspace_id = workspace_id or os.getenv("XTRA_WORKSPACE_ID")
        self.workspace_passphrase = workspace_passphrase or os.getenv("XTRA_WORKSPACE_PASSPHRASE")
        self.scope = scope or os.getenv("XTRA_VAULT_SCOPE", "workspace")
        self.api_url = api_url or os.getenv("XTRA_API_URL", "https://www.xtrasecurity.in/api")
        self.use_cache = cache
        self.cache_ttl = cache_ttl
        self.fallback_env = fallback_env
        self.offline_disk_cache = offline_disk_cache
        self.max_retries = max_retries
        self.on_telemetry = on_telemetry
        self.vault_passphrase = (
            vault_passphrase
            or os.getenv("XTRA_PROJECT_PASSPHRASE")
            or self.workspace_passphrase
            or os.getenv("XTRA_VAULT_PASSPHRASE")
            or os.getenv("XTRA_MASTER_SECRET")
        )

        config = Configuration(host=self.api_url)
        config.api_key['BearerAuth'] = f"Bearer {self.token}"

        self.api_client = ApiClient(configuration=config)
        self.secrets_api = SecretsApi(self.api_client)
        self.cache: Dict[str, Dict[str, Any]] = {}

    def _get_hardware_key(self) -> bytes:
        """Derive hardware encryption key from system identity."""
        node_id = str(uuid.getnode())
        sys_id = f"{node_id}-{platform.node()}-{getpass.getuser()}"
        return hashlib.sha256(sys_id.encode("utf-8")).digest()

    def _encrypt_payload(self, data: Dict[str, str]) -> str:
        key = self._get_hardware_key()
        json_bytes = json.dumps(data).encode("utf-8")
        encrypted = bytes([b ^ key[i % len(key)] for i, b in enumerate(json_bytes)])
        return encrypted.hex()

    def _decrypt_payload(self, payload_hex: str) -> Dict[str, str]:
        key = self._get_hardware_key()
        encrypted = bytes.fromhex(payload_hex)
        decrypted = bytes([b ^ key[i % len(key)] for i, b in enumerate(encrypted)])
        return json.loads(decrypted.decode("utf-8"))

    def derive_project_key(self, project_id: Optional[str] = None) -> bytes:
        pid = project_id or self.project_id
        if not pid:
            raise XtraError("Project ID is required.")
        user_secret = (
            self.vault_passphrase
            or os.getenv("XTRA_PROJECT_PASSPHRASE")
            or self.workspace_passphrase
            or os.getenv("XTRA_WORKSPACE_PASSPHRASE")
            or os.getenv("XTRA_VAULT_PASSPHRASE")
            or os.getenv("XTRA_MASTER_SECRET")
        )
        if not user_secret:
            raise XtraError("Vault Passphrase or Master Secret is required for Zero-Knowledge E2EE encryption/decryption.")
        salt = f"project_salt_{pid}".encode("utf-8")
        info = b"xtra-e2ee-project-key-v2"
        hkdf = HKDF(algorithm=hashes.SHA256(), length=32, salt=salt, info=info)
        return hkdf.derive(user_secret.encode("utf-8"))

    def derive_workspace_key(self, workspace_id: Optional[str] = None) -> bytes:
        ws_id = workspace_id or self.workspace_id
        if not ws_id:
            raise XtraError("Workspace ID is required.")
        user_secret = (
            self.workspace_passphrase
            or self.vault_passphrase
            or os.getenv("XTRA_WORKSPACE_PASSPHRASE")
            or os.getenv("XTRA_VAULT_PASSPHRASE")
            or os.getenv("XTRA_MASTER_SECRET")
        )
        if not user_secret:
            raise XtraError("Workspace Passphrase or Master Secret is required for Zero-Knowledge E2EE encryption/decryption.")
        salt = f"workspace_salt_{ws_id}".encode("utf-8")
        info = b"xtra-e2ee-workspace-key-v1"
        hkdf = HKDF(algorithm=hashes.SHA256(), length=32, salt=salt, info=info)
        return hkdf.derive(user_secret.encode("utf-8"))

    def encrypt_secret_value(self, plaintext: str, project_key: bytes) -> Dict[str, str]:
        aesgcm = AESGCM(project_key)
        iv = os.urandom(12)
        ciphertext_with_tag = aesgcm.encrypt(iv, plaintext.encode("utf-8"), None)
        ciphertext = ciphertext_with_tag[:-16].hex()
        auth_tag = ciphertext_with_tag[-16:].hex()
        return {"ciphertext": ciphertext, "iv": iv.hex(), "authTag": auth_tag}

    def decrypt_secret_value(self, payload: Dict[str, Any], project_key: bytes) -> str:
        aesgcm = AESGCM(project_key)
        iv = bytes.fromhex(payload["iv"])
        ciphertext = bytes.fromhex(payload["ciphertext"])
        auth_tag = bytes.fromhex(payload.get("authTag", payload.get("tag", "")))
        return aesgcm.decrypt(iv, ciphertext + auth_tag, None).decode("utf-8")

    VAULT_SENTINEL_MAGIC = "xtra_vault_sentinel_token_v3_authenticated"

    def create_vault_sentinel(self, project_id: Optional[str] = None) -> Dict[str, str]:
        key = self.derive_project_key(project_id)
        return self.encrypt_secret_value(self.VAULT_SENTINEL_MAGIC, key)

    def verify_vault_sentinel(self, sentinel_payload: Dict[str, Any], project_id: Optional[str] = None) -> bool:
        try:
            key = self.derive_project_key(project_id)
            decrypted = self.decrypt_secret_value(sentinel_payload, key)
            return decrypted == self.VAULT_SENTINEL_MAGIC
        except Exception:
            return False

    def create_workspace_vault_sentinel(self, workspace_id: Optional[str] = None) -> Dict[str, str]:
        ws_key = self.derive_workspace_key(workspace_id)
        return self.encrypt_secret_value(self.VAULT_SENTINEL_MAGIC, ws_key)

    def verify_workspace_vault_sentinel(self, sentinel_payload: Dict[str, Any], workspace_id: Optional[str] = None) -> bool:
        try:
            ws_key = self.derive_workspace_key(workspace_id)
            decrypted = self.decrypt_secret_value(sentinel_payload, ws_key)
            return decrypted == self.VAULT_SENTINEL_MAGIC
        except Exception:
            return False

    def generate_recovery_mnemonic(self) -> Dict[str, str]:
        words_list = [
            "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse",
            "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
            "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit",
            "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
            "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert",
            "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter",
            "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger",
            "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
            "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic",
            "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest",
            "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset",
            "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction",
            "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake",
            "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge",
            "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain",
            "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become",
            "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit",
            "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology",
            "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless",
            "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body",
            "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss",
            "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread",
            "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze",
            "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb",
            "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy",
            "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call",
            "calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas",
            "canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry",
            "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category",
            "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century",
            "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase",
            "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child",
            "chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle",
            "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk",
            "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close",
            "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut",
            "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort",
            "comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider", "control",
            "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost",
            "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle",
            "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek",
            "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial",
            "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture", "cup"
        ]
        entropy = os.urandom(32).hex()
        mnemonic = []
        for i in range(24):
            chunk = entropy[(i * 4) % 32 : ((i * 4) % 32) + 4]
            idx = int(chunk, 16) % len(words_list)
            mnemonic.append(words_list[idx])
        return {"mnemonic": " ".join(mnemonic), "recoveryKey": entropy}

    def _get_disk_cache_path(self, pid: str, env: str) -> str:
        home_dir = os.path.expanduser("~")
        cache_dir = os.path.join(home_dir, ".xtra", "cache")
        os.makedirs(cache_dir, exist_ok=True)
        return os.path.join(cache_dir, f"cache_{pid}_{env}.enc")

    def _write_disk_cache(self, pid: str, env: str, data: Dict[str, str]):
        if not self.offline_disk_cache:
            return
        try:
            path = self._get_disk_cache_path(pid, env)
            payload = self._encrypt_payload(data)
            with open(path, "w", encoding="utf-8") as f:
                f.write(payload)
        except Exception:
            pass

    def _read_disk_cache(self, pid: str, env: str) -> Optional[Dict[str, str]]:
        if not self.offline_disk_cache:
            return None
        try:
            path = self._get_disk_cache_path(pid, env)
            if not os.path.exists(path):
                return None
            with open(path, "r", encoding="utf-8") as f:
                payload = f.read()
            return self._decrypt_payload(payload)
        except Exception:
            return None

    def _execute_with_retry(self, fn: Callable[[], Any]) -> tuple[Any, int]:
        attempts = 0
        delay = 0.1
        while attempts <= self.max_retries:
            try:
                res = fn()
                return res, attempts
            except Exception as e:
                attempts += 1
                if attempts > self.max_retries:
                    raise e
                time.sleep(delay)
                delay *= 2

    def get_secrets(
        self,
        env: str = "development",
        project_id: Optional[str] = None,
        branch: Optional[str] = None,
        no_cache: bool = False,
        fallback_env: Optional[str] = None
    ) -> Dict[str, str]:
        start_time = time.time()
        pid = project_id or self.project_id
        if not pid:
            raise XtraError("Project ID is required. Pass project_id or set XTRA_PROJECT_ID.")

        cache_key = f"{pid}:{env}:{branch or 'main'}"
        now = time.time()

        if self.use_cache and not no_cache:
            if cache_key in self.cache and self.cache[cache_key]["expires_at"] > now:
                cached_data = self.cache[cache_key]["data"]
                if self.on_telemetry:
                    self.on_telemetry({
                        "source": "memory_cache",
                        "environment": env,
                        "project_id": pid,
                        "latency_ms": (time.time() - start_time) * 1000,
                        "secret_count": len(cached_data),
                        "retry_count": 0
                    })
                return cached_data

        try:
            response, retry_count = self._execute_with_retry(
                lambda: self.secrets_api.get_secrets(project_id=pid, env=env, branch=branch)
            )
            data = dict(response) if isinstance(response, dict) else (response.to_dict() if hasattr(response, 'to_dict') else {})
            
            project_key = self.derive_project_key(pid)
            for k, v in data.items():
                if isinstance(v, str) and v.startswith('{') and 'ciphertext' in v:
                    try:
                        parsed = json.loads(v)
                        if 'ciphertext' in parsed and 'iv' in parsed:
                            data[k] = self.decrypt_secret_value(parsed, project_key)
                    except Exception:
                        pass
            
            # Multi-Environment Fallback Resolution (Task A33)
            active_fallback = fallback_env or self.fallback_env
            if active_fallback and active_fallback != env:
                try:
                    fallback_resp, _ = self._execute_with_retry(
                        lambda: self.secrets_api.get_secrets(project_id=pid, env=active_fallback, branch=branch)
                    )
                    fallback_data = dict(fallback_resp) if isinstance(fallback_resp, dict) else (fallback_resp.to_dict() if hasattr(fallback_resp, 'to_dict') else {})
                    data = {**fallback_data, **data}
                except Exception:
                    pass

            if self.use_cache:
                self.cache[cache_key] = {"data": data, "expires_at": now + self.cache_ttl}

            self._write_disk_cache(pid, env, data)

            if self.on_telemetry:
                self.on_telemetry({
                    "source": "network",
                    "environment": env,
                    "project_id": pid,
                    "latency_ms": (time.time() - start_time) * 1000,
                    "secret_count": len(data),
                    "retry_count": retry_count
                })

            return data
        except Exception as e:
            # Transparent Offline Hardware Encrypted Disk Fallback (Task A17)
            disk_cached = self._read_disk_cache(pid, env)
            if disk_cached is not None:
                if self.use_cache:
                    self.cache[cache_key] = {"data": disk_cached, "expires_at": now + self.cache_ttl}
                if self.on_telemetry:
                    self.on_telemetry({
                        "source": "disk_cache",
                        "environment": env,
                        "project_id": pid,
                        "latency_ms": (time.time() - start_time) * 1000,
                        "secret_count": len(disk_cached),
                        "retry_count": self.max_retries
                    })
                return disk_cached

            raise XtraError(f"Failed to fetch secrets: {str(e)}")

    def get_secret(
        self,
        key: str,
        default: Optional[str] = None,
        env: str = "development",
        project_id: Optional[str] = None,
        branch: Optional[str] = None
    ) -> Optional[str]:
        secrets = self.get_secrets(env=env, project_id=project_id, branch=branch)
        return secrets.get(key, default)

    def upsert_secrets(
        self,
        env: str,
        secrets: Dict[str, str],
        project_id: Optional[str] = None
    ) -> Any:
        pid = project_id or self.project_id
        if not pid:
            raise XtraError("Project ID is required.")
        
        project_key = self.derive_project_key(pid)
        encrypted_secrets = {}
        for k, v in secrets.items():
            if isinstance(v, str) and v.startswith('{') and 'ciphertext' in v:
                encrypted_secrets[k] = v
            else:
                enc = self.encrypt_secret_value(str(v), project_key)
                encrypted_secrets[k] = json.dumps(enc)
                
        # OpenAPI expects UpsertSecretsRequest with a 'secrets' dict.
        # But we pass the dict to the api method directly usually via kwargs.
        response, _ = self._execute_with_retry(
            lambda: self.secrets_api.upsert_secrets(
                project_id=pid,
                env=env,
                upsert_secrets_request={"secrets": encrypted_secrets}
            )
        )
        return response

    def inject_secrets(
        self,
        env: str = "development",
        override: bool = False,
        project_id: Optional[str] = None,
        branch: Optional[str] = None
    ) -> Dict[str, str]:
        secrets = self.get_secrets(env=env, project_id=project_id, branch=branch)
        for k, v in secrets.items():
            if override or k not in os.environ:
                os.environ[k] = str(v)
        return secrets

    @contextmanager
    def inject_context(self, env: str = "development", override: bool = True):
        previous_env = dict(os.environ)
        try:
            self.inject_secrets(env=env, override=override)
            yield os.environ
        finally:
            os.environ.clear()
            os.environ.update(previous_env)

    def clear_cache(self):
        self.cache.clear()

    # --- Framework Auto-Injectors (Task A28) ---

    def setup_fastapi(self, app: Any, env: str = "development"):
        @app.on_event("startup")
        def startup_event():
            self.inject_secrets(env=env)

    def setup_django(self, env: str = "development"):
        return self.inject_secrets(env=env)

    def setup_flask(self, app: Any, env: str = "development"):
        secrets = self.inject_secrets(env=env)
        if hasattr(app, "config"):
            app.config.update(secrets)
