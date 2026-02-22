"""
Tests for the branch app: Branch CRUD via /api/v1/branch/branch/
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from branch.models import Branch
from tests.factories import (
    create_company, create_user, create_auth_token, create_branch, auth_header,
)


class BranchCRUDTests(TestCase):
    """Test /api/v1/branch/branch/ (BranchViewSet)"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="branchuser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.base_url = "/api/v1/branch/branch/"

    def test_list_branches(self):
        create_branch(self.company, name="Branch A")
        create_branch(self.company, name="Branch B")
        resp = self.client.get(self.base_url, **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_create_branch(self):
        data = {"name": "New Branch", "description": "Desc", "timezone": "Asia/Dubai"}
        resp = self.client.post(self.base_url, data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Branch.objects.filter(name="New Branch").exists())

    def test_retrieve_branch(self):
        branch = create_branch(self.company, name="Detail Branch")
        resp = self.client.get(f"{self.base_url}{branch.id}/", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["name"], "Detail Branch")

    def test_update_branch(self):
        branch = create_branch(self.company, name="Old Branch")
        data = {"name": "Updated Branch", "description": "Updated", "timezone": "Asia/Dubai"}
        resp = self.client.put(f"{self.base_url}{branch.id}/", data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        branch.refresh_from_db()
        self.assertEqual(branch.name, "Updated Branch")

    def test_delete_branch(self):
        branch = create_branch(self.company, name="Delete Me")
        resp = self.client.delete(f"{self.base_url}{branch.id}/", **auth_header(self.token))
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
        self.assertFalse(Branch.objects.filter(id=branch.id).exists())

    def test_unauthenticated(self):
        resp = self.client.get(self.base_url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_company_isolation(self):
        """User should NOT see branches from another company."""
        other_company = create_company("Other Co")
        create_branch(other_company, name="Other Branch")
        resp = self.client.get(self.base_url, **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        names = [item["name"] for item in resp.data.get("results", resp.data)]
        self.assertNotIn("Other Branch", names)

    def test_search_branches(self):
        create_branch(self.company, name="Alpha")
        create_branch(self.company, name="Beta")
        resp = self.client.get(f"{self.base_url}?search=Alpha", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get("results", resp.data)
        self.assertTrue(all("Alpha" in b["name"] for b in results))
