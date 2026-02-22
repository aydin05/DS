"""
Tests for the notification app: EmailConfig, EmailTemplate, RecipientList, Recipient, NotificationSetting.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from notification.models import (
    EmailConfig, EmailTemplate, RecipientList, Recipient, NotificationSetting,
)
from tests.factories import (
    create_company, create_user, create_auth_token, create_branch, auth_header,
)


class EmailConfigTests(TestCase):
    """Test /api/v1/notification/email-config/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="ecuser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.base_url = "/api/v1/notification/email-config/"

    def test_list_empty(self):
        resp = self.client.get(self.base_url, **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_create_email_config(self):
        data = {
            "host": "smtp.test.com",
            "port": 587,
            "username": "notify@test.com",
            "password": "secret",
            "use_tls": True,
            "from_name": "DS Notifier",
            "is_active": True,
        }
        resp = self.client.post(self.base_url, data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(EmailConfig.objects.filter(company=self.company).exists())

    def test_update_email_config(self):
        ec = EmailConfig.objects.create(
            company=self.company, host="old.smtp.com", port=587,
            username="old@test.com", password="old",
        )
        resp = self.client.patch(
            f"{self.base_url}{ec.id}/",
            {"host": "new.smtp.com"}, format="json",
            **auth_header(self.token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ec.refresh_from_db()
        self.assertEqual(ec.host, "new.smtp.com")

    def test_delete_email_config(self):
        ec = EmailConfig.objects.create(
            company=self.company, host="del.smtp.com", port=587,
            username="del@test.com", password="del",
        )
        resp = self.client.delete(f"{self.base_url}{ec.id}/", **auth_header(self.token))
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])


class EmailTemplateTests(TestCase):
    """Test /api/v1/notification/email-templates/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="etuser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.base_url = "/api/v1/notification/email-templates/"

    def test_create_template(self):
        data = {
            "name": "Device Down",
            "subject": "Alert: {{device_name}} is down",
            "body": "Device {{device_name}} in {{branch_name}} went offline.",
            "is_default": True,
        }
        resp = self.client.post(self.base_url, data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_duplicate_name_same_company(self):
        EmailTemplate.objects.create(
            company=self.company, name="Dup", subject="s", body="b",
        )
        data = {"name": "Dup", "subject": "s2", "body": "b2"}
        resp = self.client.post(self.base_url, data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_templates(self):
        EmailTemplate.objects.create(
            company=self.company, name="T1", subject="s", body="b",
        )
        resp = self.client.get(self.base_url, **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class RecipientListTests(TestCase):
    """Test /api/v1/notification/recipient-lists/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="rluser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.base_url = "/api/v1/notification/recipient-lists/"

    def test_create_recipient_list(self):
        data = {"name": "IT Team", "description": "IT admins"}
        resp = self.client.post(self.base_url, data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_create_with_branches(self):
        b = create_branch(self.company, name="HQ")
        data = {"name": "HQ List", "branches": [b.id]}
        resp = self.client.post(self.base_url, data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_list(self):
        RecipientList.objects.create(company=self.company, name="L1")
        resp = self.client.get(self.base_url, **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_delete(self):
        rl = RecipientList.objects.create(company=self.company, name="Del")
        resp = self.client.delete(f"{self.base_url}{rl.id}/", **auth_header(self.token))
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])


class RecipientTests(TestCase):
    """Test /api/v1/notification/recipients/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="rcuser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.rl = RecipientList.objects.create(company=self.company, name="Main List")
        self.base_url = "/api/v1/notification/recipients/"

    def test_create_recipient(self):
        data = {"recipient_list": self.rl.id, "email": "admin@corp.com", "name": "Admin"}
        resp = self.client.post(self.base_url, data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_duplicate_email_in_same_list(self):
        Recipient.objects.create(recipient_list=self.rl, email="dup@corp.com", name="A")
        data = {"recipient_list": self.rl.id, "email": "dup@corp.com", "name": "B"}
        resp = self.client.post(self.base_url, data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_recipients(self):
        Recipient.objects.create(recipient_list=self.rl, email="a@corp.com")
        resp = self.client.get(self.base_url, **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class NotificationSettingTests(TestCase):
    """Test /api/v1/notification/notification-settings/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="nsuser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.base_url = "/api/v1/notification/notification-settings/"

    def test_create_notification_setting(self):
        data = {"is_enabled": True, "check_interval_seconds": 120}
        resp = self.client.post(self.base_url, data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_list(self):
        NotificationSetting.objects.create(company=self.company, is_enabled=True)
        resp = self.client.get(self.base_url, **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
