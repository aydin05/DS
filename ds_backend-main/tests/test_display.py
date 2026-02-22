"""
Tests for the display app: DisplayType, DisplayGroup, Display CRUD.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from display.models import DisplayType, DisplayGroup, Display
from tests.factories import (
    create_company, create_user, create_auth_token, create_branch,
    create_display_type, create_display_group, create_display,
    create_playlist, auth_header,
)


class DisplayTypeCRUDTests(TestCase):
    """Test /api/v1/display/display-type/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="dtuser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.base_url = "/api/v1/display/display-type/"

    def test_list_display_types(self):
        create_display_type(self.company, name="FHD")
        resp = self.client.get(self.base_url, **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_create_display_type(self):
        data = {"name": "4K", "width": 3840, "height": 2160, "description": "4K display"}
        resp = self.client.post(self.base_url, data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(DisplayType.objects.filter(name="4K").exists())

    def test_update_display_type(self):
        dt = create_display_type(self.company, name="Old Name")
        data = {"name": "New Name", "width": 1920, "height": 1080}
        resp = self.client.put(f"{self.base_url}{dt.id}/", data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        dt.refresh_from_db()
        self.assertEqual(dt.name, "New Name")

    def test_delete_display_type(self):
        dt = create_display_type(self.company, name="Delete Me")
        resp = self.client.delete(f"{self.base_url}{dt.id}/", **auth_header(self.token))
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])

    def test_company_isolation(self):
        other = create_company("Other")
        create_display_type(other, name="Hidden")
        resp = self.client.get(self.base_url, **auth_header(self.token))
        names = [d["name"] for d in resp.data.get("results", resp.data)]
        self.assertNotIn("Hidden", names)


class DisplayGroupCRUDTests(TestCase):
    """Test /api/v1/display/display-group/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="dguser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.dt = create_display_type(self.company)
        self.playlist = create_playlist(self.company, self.dt)
        self.base_url = "/api/v1/display/display-group/"

    def test_list_display_groups(self):
        create_display_group(self.company, name="Group 1")
        resp = self.client.get(self.base_url, **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_create_display_group(self):
        data = {"name": "New Group", "playlist": self.playlist.id}
        resp = self.client.post(self.base_url, data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_delete_display_group(self):
        dg = create_display_group(self.company, name="Del Group")
        resp = self.client.delete(f"{self.base_url}{dg.id}/", **auth_header(self.token))
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])


class DisplayCRUDTests(TestCase):
    """Test /api/v1/display/display/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="dispuser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.branch = create_branch(self.company)
        self.dt = create_display_type(self.company)
        self.base_url = "/api/v1/display/display/"

    def test_list_displays(self):
        create_display(self.company, self.branch, self.dt, name="D1", username="d1")
        resp = self.client.get(self.base_url, **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_create_display(self):
        data = {
            "name": "New Display",
            "username": "newdisp",
            "password": "pass123",
            "display_type": self.dt.id,
            "branch": self.branch.id,
        }
        resp = self.client.post(self.base_url, data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_delete_display(self):
        d = create_display(self.company, self.branch, self.dt, username="deldisp")
        resp = self.client.delete(f"{self.base_url}{d.id}/", **auth_header(self.token))
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])

    def test_unassigned_displays(self):
        create_display(self.company, self.branch, self.dt, name="Unassigned", username="unassigned1")
        resp = self.client.get("/api/v1/display/unassigned-display/", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
