"""
Tests for the account app: Registration, Login, Logout, User CRUD, Role CRUD.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from tests.factories import (
    create_company, create_user, create_auth_token, create_branch,
    create_role_group, create_group_with_code, auth_header,
)

User = get_user_model()


class RegistrationTests(TestCase):
    """Test POST /api/v1/accounts/register/"""

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/v1/accounts/register/"

    def test_register_success(self):
        data = {
            "fullname": "New User",
            "email": "newuser@test.com",
            "phone_number": "1234567890",
            "company": {"name": "New Company", "country": "AZ"},
            "password": "StrongP@ss1",
            "password_confirmation": "StrongP@ss1",
        }
        resp = self.client.post(self.url, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="newuser@test.com").exists())

    def test_register_password_mismatch(self):
        data = {
            "fullname": "New User",
            "email": "mismatch@test.com",
            "phone_number": "1234567890",
            "company": {"name": "Comp", "country": "AZ"},
            "password": "StrongP@ss1",
            "password_confirmation": "WrongP@ss2",
        }
        resp = self.client.post(self.url, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_email(self):
        company = create_company()
        create_user(company, email="dup@test.com")
        data = {
            "fullname": "Dup User",
            "email": "dup@test.com",
            "phone_number": "111",
            "company": {"name": "Comp2", "country": "AZ"},
            "password": "StrongP@ss1",
            "password_confirmation": "StrongP@ss1",
        }
        resp = self.client.post(self.url, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_weak_password(self):
        data = {
            "fullname": "Weak",
            "email": "weak@test.com",
            "phone_number": "111",
            "company": {"name": "Comp3", "country": "AZ"},
            "password": "123",
            "password_confirmation": "123",
        }
        resp = self.client.post(self.url, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_inactive_user_returns_400(self):
        company = create_company("Inactive Co")
        create_user(company, email="inactive@test.com")
        User.objects.filter(email="inactive@test.com").update(is_active=False)
        data = {
            "fullname": "Re-register",
            "email": "inactive@test.com",
            "phone_number": "111",
            "company": {"name": "Comp4", "country": "AZ"},
            "password": "StrongP@ss1",
            "password_confirmation": "StrongP@ss1",
        }
        resp = self.client.post(self.url, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.data.get("error"), "not_activated")


class LoginTests(TestCase):
    """Test POST /api/v1/accounts/login/"""

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/v1/accounts/login/"
        self.company = create_company()
        self.user = create_user(self.company, email="login@test.com", password="StrongP@ss1")

    def test_login_success(self):
        resp = self.client.post(self.url, {"email": "login@test.com", "password": "StrongP@ss1"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("token", resp.data)
        self.assertEqual(resp.data["email"], "login@test.com")

    def test_login_wrong_password(self):
        resp = self.client.post(self.url, {"email": "login@test.com", "password": "Wrong1234!"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_nonexistent_email(self):
        resp = self.client.post(self.url, {"email": "noone@test.com", "password": "StrongP@ss1"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_case_insensitive_email(self):
        resp = self.client.post(self.url, {"email": "LOGIN@TEST.COM", "password": "StrongP@ss1"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class LogoutTests(TestCase):
    """Test GET /api/v1/accounts/logout/ and /logout-all/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="logout@test.com")
        self.token = create_auth_token(self.user)

    def test_logout_success(self):
        resp = self.client.get("/api/v1/accounts/logout/", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_logout_without_token(self):
        resp = self.client.get("/api/v1/accounts/logout/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_all(self):
        create_auth_token(self.user)  # second token
        resp = self.client.get("/api/v1/accounts/logout-all/", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)


class UserCRUDTests(TestCase):
    """Test /api/v1/accounts/user/ (CompanyUserViewSet via router)"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.master_user = create_user(self.company, email="master@test.com", is_master=True)
        self.token = create_auth_token(self.master_user)
        self.branch = create_branch(self.company)
        self.role_group = create_role_group(self.company)
        self.base_url = "/api/v1/accounts/user/"

    def test_list_users(self):
        resp = self.client.get(self.base_url, **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_create_user(self):
        data = {
            "fullname": "New Employee",
            "email": "employee@test.com",
            "phone_number": "555",
            "password": "StrongP@ss1",
            "password_confirmation": "StrongP@ss1",
            "role": [self.role_group.id],
            "branch": [self.branch.id],
            "is_admin": False,
        }
        resp = self.client.post(self.base_url, data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="employee@test.com").exists())

    def test_create_user_duplicate_email(self):
        create_user(self.company, email="dup@test.com")
        data = {
            "fullname": "Dup",
            "email": "dup@test.com",
            "phone_number": "555",
            "password": "StrongP@ss1",
            "password_confirmation": "StrongP@ss1",
            "role": [self.role_group.id],
            "branch": [self.branch.id],
        }
        resp = self.client.post(self.base_url, data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_user(self):
        user = create_user(self.company, email="upd@test.com")
        data = {"fullname": "Updated Name", "email": "upd@test.com",
                "phone_number": "999", "password": "StrongP@ss1",
                "password_confirmation": "StrongP@ss1",
                "role": [self.role_group.id], "branch": [self.branch.id]}
        resp = self.client.put(f"{self.base_url}{user.id}/", data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.fullname, "Updated Name")

    def test_delete_user(self):
        user = create_user(self.company, email="del@test.com")
        resp = self.client.delete(f"{self.base_url}{user.id}/", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(email="del@test.com").exists())

    def test_delete_master_user_forbidden(self):
        resp = self.client.delete(f"{self.base_url}{self.master_user.id}/", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_access(self):
        resp = self.client.get(self.base_url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class RoleGroupCRUDTests(TestCase):
    """Test /api/v1/accounts/role/ (RoleGroupViewSet)"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="rolemaster@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.base_url = "/api/v1/accounts/role/"

    def test_list_roles(self):
        create_role_group(self.company, name="Role A")
        resp = self.client.get(self.base_url, **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_create_role(self):
        resp = self.client.post(self.base_url, {"name": "Admin Role", "role": []}, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_create_duplicate_role_name(self):
        create_role_group(self.company, name="Dup Role")
        resp = self.client.post(self.base_url, {"name": "Dup Role", "role": []}, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_role(self):
        rg = create_role_group(self.company, name="Old Name")
        resp = self.client.put(f"{self.base_url}{rg.id}/", {"name": "New Name", "role": []}, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_delete_role(self):
        rg = create_role_group(self.company, name="To Delete")
        resp = self.client.delete(f"{self.base_url}{rg.id}/", **auth_header(self.token))
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])


class CountryViewTests(TestCase):
    """Test GET /api/v1/accounts/countries/"""

    def test_get_countries(self):
        client = APIClient()
        resp = client.get("/api/v1/accounts/countries/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
