import os
import unittest
from unittest.mock import MagicMock

from xtra import XtraClient, XtraError

class TestXtraClientPythonSDK(unittest.TestCase):
    def setUp(self):
        self.original_env = dict(os.environ)
        os.environ["XTRA_TOKEN"] = "test-python-token"
        os.environ["XTRA_PROJECT_ID"] = "proj-python-123"

    def tearDown(self):
        os.environ.clear()
        os.environ.update(self.original_env)

    def test_constructor_validation(self):
        del os.environ["XTRA_TOKEN"]
        with self.assertRaises(XtraError):
            XtraClient()

    def test_get_secrets_and_fallback(self):
        client = XtraClient(token="valid-token", project_id="proj-1", fallback_env="staging")
        client.secrets_api.get_secrets = MagicMock(side_effect=lambda project_id, env, branch=None: {
            "development": {"DATABASE_URL": "dev_db", "DEV_ONLY": "true"},
            "staging": {"DATABASE_URL": "stg_db", "SHARED_KEY": "stg_val"}
        }.get(env, {}))

        secrets = client.get_secrets("development")
        self.assertEqual(secrets["DATABASE_URL"], "dev_db")
        self.assertEqual(secrets["DEV_ONLY"], "true")
        self.assertEqual(secrets["SHARED_KEY"], "stg_val")

    def test_get_secret_single_lookup(self):
        client = XtraClient(token="valid-token", project_id="proj-1")
        client.secrets_api.get_secrets = MagicMock(return_value={"API_KEY": "sk_live_123"})

        val = client.get_secret("API_KEY")
        self.assertEqual(val, "sk_live_123")

        missing = client.get_secret("NON_EXISTENT", default="default_val")
        self.assertEqual(missing, "default_val")

    def test_motherboard_hardware_disk_cache_and_offline_fallback(self):
        telemetry_logs = []
        client = XtraClient(
            token="valid-token",
            project_id="proj-1",
            max_retries=0,
            on_telemetry=lambda m: telemetry_logs.append(m)
        )

        # 1. Online call populates hardware-encrypted disk cache
        client.secrets_api.get_secrets = MagicMock(return_value={"OFFLINE_KEY": "secret_data"})
        data1 = client.get_secrets("development")
        self.assertEqual(data1["OFFLINE_KEY"], "secret_data")

        # 2. Simulate API network failure
        client.clear_cache()
        client.secrets_api.get_secrets = MagicMock(side_effect=Exception("API connection down"))

        # Transparent failover reads motherboard-bound disk cache
        data2 = client.get_secrets("development")
        self.assertEqual(data2["OFFLINE_KEY"], "secret_data")
        self.assertTrue(len(telemetry_logs) >= 2)
        self.assertEqual(telemetry_logs[-1]["source"], "disk_cache")

    def test_context_manager_injection(self):
        client = XtraClient(token="valid-token", project_id="proj-1")
        client.secrets_api.get_secrets = MagicMock(return_value={"SECRET_FOO": "bar"})

        with client.inject_context("development"):
            self.assertEqual(os.environ.get("SECRET_FOO"), "bar")

        self.assertNotIn("SECRET_FOO", os.environ)

    def test_fastapi_and_flask_injectors(self):
        client = XtraClient(token="valid-token", project_id="proj-1")
        client.secrets_api.get_secrets = MagicMock(return_value={"FLASK_SECRET": "xyz"})

        class MockApp:
            def __init__(self):
                self.config = {}

        app = MockApp()
        client.setup_flask(app)
        self.assertEqual(app.config.get("FLASK_SECRET"), "xyz")

if __name__ == "__main__":
    unittest.main()
