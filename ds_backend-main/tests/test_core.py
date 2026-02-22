"""
Tests for the core app: Heartbeat, LogReceiver, CompanySettings, DeviceLogs.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from core.models import DeviceLog, CompanySettings
from display.models import Display
from tests.factories import (
    create_company, create_user, create_auth_token, create_branch,
    create_display_type, create_display, auth_header,
)


class HeartbeatTests(TestCase):
    """Test POST /api/v1/core/heartbeat/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.branch = create_branch(self.company)
        self.dt = create_display_type(self.company)
        self.display = create_display(
            self.company, self.branch, self.dt,
            name="HB Display", username="hbdisp", password="hbpass",
        )
        self.url = "/api/v1/core/heartbeat/"

    def test_heartbeat_tizen_success(self):
        resp = self.client.post(self.url, {
            "username": "hbdisp", "password": "hbpass", "source": "tizen"
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.display.refresh_from_db()
        self.assertIsNotNone(self.display.last_heartbeat)
        self.assertEqual(self.display.last_heartbeat_source, "tizen")

    def test_heartbeat_openlink_no_password(self):
        resp = self.client.post(self.url, {
            "username": "hbdisp", "source": "openlink"
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.display.refresh_from_db()
        self.assertEqual(self.display.last_heartbeat_source, "openlink")

    def test_heartbeat_missing_username(self):
        resp = self.client.post(self.url, {"password": "x"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_heartbeat_wrong_credentials(self):
        resp = self.client.post(self.url, {
            "username": "hbdisp", "password": "wrong", "source": "tizen"
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_heartbeat_nonexistent_display(self):
        resp = self.client.post(self.url, {
            "username": "noexist", "password": "x", "source": "tizen"
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_heartbeat_tizen_missing_password(self):
        resp = self.client.post(self.url, {
            "username": "hbdisp", "source": "tizen"
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_heartbeat_creates_device_log_if_missing(self):
        self.assertFalse(DeviceLog.objects.filter(device=self.display).exists())
        self.client.post(self.url, {
            "username": "hbdisp", "password": "hbpass", "source": "tizen"
        }, format="json")
        self.assertTrue(DeviceLog.objects.filter(device=self.display).exists())


class LogReceiverTests(TestCase):
    """Test POST /api/v1/core/device-logs/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.branch = create_branch(self.company)
        self.dt = create_display_type(self.company)
        self.display = create_display(
            self.company, self.branch, self.dt,
            name="Log Display", username="logdisp", password="logpass",
        )
        self.url = "/api/v1/core/device-logs/"

    def test_submit_logs_success(self):
        data = {
            "deviceId": "dev123",
            "username": "logdisp",
            "password": "logpass",
            "logs": [
                {"timestamp": "2026-01-01T00:00:00", "level": "INFO", "message": "Boot complete"},
                {"timestamp": "2026-01-01T00:00:01", "level": "ERROR", "message": "Network error"},
            ],
        }
        resp = self.client.post(self.url, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn("2 logs processed", resp.data["message"])
        self.assertTrue(DeviceLog.objects.filter(device=self.display).exists())

    def test_submit_logs_missing_username(self):
        resp = self.client.post(self.url, {"logs": []}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_submit_logs_missing_logs_array(self):
        resp = self.client.post(self.url, {
            "username": "logdisp", "password": "logpass"
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_submit_logs_nonexistent_display(self):
        resp = self.client.post(self.url, {
            "username": "noone", "password": "x", "logs": [{"message": "x"}]
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_submit_logs_updates_heartbeat(self):
        self.assertIsNone(self.display.last_heartbeat)
        self.client.post(self.url, {
            "username": "logdisp", "password": "logpass",
            "logs": [{"message": "test"}],
        }, format="json")
        self.display.refresh_from_db()
        self.assertIsNotNone(self.display.last_heartbeat)


class CompanySettingsTests(TestCase):
    """Test GET/PUT /api/v1/core/company-settings/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="csuser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.url = "/api/v1/core/company-settings/"

    def test_get_default_settings(self):
        resp = self.client.get(self.url, **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["heartbeat_threshold_seconds"], 120)

    def test_update_settings(self):
        resp = self.client.put(self.url, {"heartbeat_threshold_seconds": 60}, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["heartbeat_threshold_seconds"], 60)

    def test_update_invalid_value(self):
        resp = self.client.put(self.url, {"heartbeat_threshold_seconds": 99}, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class DeviceLogViewSetTests(TestCase):
    """Test /api/v1/core/logs/ (DeviceLogViewSet)"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="dluser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.branch = create_branch(self.company)
        self.dt = create_display_type(self.company)
        self.display = create_display(
            self.company, self.branch, self.dt,
            name="DL Display", username="dldisp", password="dlpass",
        )
        self.log = DeviceLog.objects.create(
            device=self.display, company=self.company,
            message="test log", level="INFO",
        )
        self.base_url = "/api/v1/core/logs/"

    def test_list_device_logs(self):
        resp = self.client.get(self.base_url, **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_retrieve_device_log(self):
        resp = self.client.get(f"{self.base_url}{self.log.id}/", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_filter_by_status_active(self):
        self.display.last_heartbeat = timezone.now()
        self.display.save()
        resp = self.client.get(f"{self.base_url}?status=true", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_filter_by_status_inactive(self):
        resp = self.client.get(f"{self.base_url}?status=false", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_search_by_device_name(self):
        resp = self.client.get(f"{self.base_url}?search=DL Display", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_company_isolation(self):
        other = create_company("Other")
        other_branch = create_branch(other, name="OB")
        other_dt = create_display_type(other, name="ODT")
        other_disp = create_display(other, other_branch, other_dt, name="OD", username="od1")
        DeviceLog.objects.create(device=other_disp, company=other, message="hidden", level="INFO")
        resp = self.client.get(self.base_url, **auth_header(self.token))
        results = resp.data.get("results", resp.data)
        device_ids = [r.get("device") or r.get("id") for r in results]
        self.assertNotIn(other_disp.id, device_ids)
