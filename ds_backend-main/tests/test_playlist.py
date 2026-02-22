"""
Tests for the playlist app: Playlist CRUD, Publish, Discard, Duplicate, Slides, Schedule.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from playlist.models import Playlist, Schedule, Slide, SlideItem
from tests.factories import (
    create_company, create_user, create_auth_token, create_branch,
    create_display_type, create_playlist, create_schedule, create_slide,
    create_widget_type, auth_header,
)


class PlaylistCRUDTests(TestCase):
    """Test /api/v1/playlist/playlist/ (PlaylistViewSet)"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="pluser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.dt = create_display_type(self.company)
        self.base_url = "/api/v1/playlist/playlist/"

    def test_list_playlists(self):
        create_playlist(self.company, self.dt, name="PL1")
        resp = self.client.get(self.base_url, **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_create_playlist(self):
        data = {
            "name": "New PL",
            "description": "Desc",
            "default_display_type": self.dt.id,
        }
        resp = self.client.post(self.base_url, data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Playlist.objects.filter(name="New PL").exists())

    def test_update_playlist(self):
        pl = create_playlist(self.company, self.dt, name="Old PL")
        data = {"name": "Updated PL", "description": "Updated", "default_display_type": self.dt.id}
        resp = self.client.put(f"{self.base_url}{pl.id}/", data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        pl.refresh_from_db()
        self.assertEqual(pl.name, "Updated PL")

    def test_delete_playlist(self):
        pl = create_playlist(self.company, self.dt, name="Del PL")
        resp = self.client.delete(f"{self.base_url}{pl.id}/", **auth_header(self.token))
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
        self.assertFalse(Playlist.objects.filter(id=pl.id).exists())

    def test_company_isolation(self):
        other_co = create_company("Other")
        other_dt = create_display_type(other_co, name="Other DT")
        create_playlist(other_co, other_dt, name="Hidden PL")
        resp = self.client.get(self.base_url, **auth_header(self.token))
        names = [p["name"] for p in resp.data.get("results", resp.data)]
        self.assertNotIn("Hidden PL", names)

    def test_search_playlists(self):
        create_playlist(self.company, self.dt, name="Alpha PL")
        create_playlist(self.company, self.dt, name="Beta PL")
        resp = self.client.get(f"{self.base_url}?search=Alpha", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get("results", resp.data)
        self.assertTrue(all("Alpha" in p["name"] for p in results))

    def test_unauthenticated(self):
        resp = self.client.get(self.base_url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class PlaylistPublishTests(TestCase):
    """Test POST /api/v1/playlist/playlist/{id}/publish/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="pubuser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.dt = create_display_type(self.company)
        self.wt = create_widget_type(self.company)

    def test_publish_with_extra_fields(self):
        pl = create_playlist(self.company, self.dt)
        pl.extra_fields = [
            {
                "name": "Slide 1",
                "position": 0,
                "duration": 5,
                "bg_color": "#fff",
                "items": [
                    {
                        "type": self.wt.id,
                        "top": 0, "left": 0, "width": 200, "height": 200,
                        "index": 0, "attr": {},
                        "display_types": [{"id": self.dt.id, "top": 0, "left": 0, "width": 200, "height": 200}],
                    }
                ],
            }
        ]
        pl.save()
        resp = self.client.post(
            f"/api/v1/playlist/playlist/{pl.id}/publish/",
            **auth_header(self.token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("Playlist published", resp.data.get("message", ""))
        pl.refresh_from_db()
        self.assertEqual(pl.extra_fields, [])
        self.assertTrue(Slide.objects.filter(playlist=pl).exists())

    def test_publish_empty_extra_fields_returns_400(self):
        pl = create_playlist(self.company, self.dt)
        pl.extra_fields = []
        pl.save()
        resp = self.client.post(
            f"/api/v1/playlist/playlist/{pl.id}/publish/",
            **auth_header(self.token),
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_publish_nonexistent_playlist_returns_404(self):
        resp = self.client.post(
            "/api/v1/playlist/playlist/99999/publish/",
            **auth_header(self.token),
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class PlaylistDiscardTests(TestCase):
    """Test POST /api/v1/playlist/playlist/{id}/discard/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="discuser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.dt = create_display_type(self.company)

    def test_discard_clears_extra_fields(self):
        pl = create_playlist(self.company, self.dt)
        pl.extra_fields = [{"name": "draft slide"}]
        pl.save()
        resp = self.client.post(
            f"/api/v1/playlist/playlist/{pl.id}/discard/",
            **auth_header(self.token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        pl.refresh_from_db()
        self.assertEqual(pl.extra_fields, [])


class PlaylistDuplicateTests(TestCase):
    """Test POST /api/v1/playlist/playlist/{id}/duplicate/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="dupuser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.dt = create_display_type(self.company)

    def test_duplicate_playlist(self):
        pl = create_playlist(self.company, self.dt, name="Original")
        create_slide(pl, self.company, name="S1", position=0)
        resp = self.client.post(
            f"/api/v1/playlist/playlist/{pl.id}/duplicate/",
            **auth_header(self.token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(Playlist.objects.filter(name="Copy of Original").exists())
        dup = Playlist.objects.get(name="Copy of Original")
        self.assertEqual(dup.slide_set.count(), 1)


class ScheduleCRUDTests(TestCase):
    """Test /api/v1/playlist/schedule/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="schuser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.dt = create_display_type(self.company)
        self.pl = create_playlist(self.company, self.dt)
        self.base_url = "/api/v1/playlist/schedule/"

    def test_list_schedules(self):
        create_schedule(self.company, self.pl, name="Sch1")
        resp = self.client.get(self.base_url, **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_create_schedule(self):
        data = {"name": "New Schedule", "default_playlist": self.pl.id}
        resp = self.client.post(self.base_url, data, format="json", **auth_header(self.token))
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_delete_schedule(self):
        sch = create_schedule(self.company, self.pl, name="Del Sch")
        resp = self.client.delete(f"{self.base_url}{sch.id}/", **auth_header(self.token))
        self.assertIn(resp.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])


class SlideApiViewTests(TestCase):
    """Test /api/v1/playlist/{id}/slide/"""

    def setUp(self):
        self.client = APIClient()
        self.company = create_company()
        self.user = create_user(self.company, email="slideuser@test.com", is_master=True)
        self.token = create_auth_token(self.user)
        self.dt = create_display_type(self.company)
        self.wt = create_widget_type(self.company)
        self.pl = create_playlist(self.company, self.dt)

    def test_get_slides_empty(self):
        resp = self.client.get(
            f"/api/v1/playlist/{self.pl.id}/slide/",
            **auth_header(self.token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data, [])

    def test_post_slides_creates_slides(self):
        data = [
            {
                "name": "Slide 1",
                "position": 0,
                "duration": 10,
                "bg_color": "#000",
                "items": [
                    {
                        "type": self.wt.id,
                        "top": 0, "left": 0, "width": 100, "height": 100,
                        "index": 0, "attr": {},
                    }
                ],
            }
        ]
        resp = self.client.post(
            f"/api/v1/playlist/{self.pl.id}/slide/?display_type={self.dt.id}",
            data, format="json",
            **auth_header(self.token),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(Slide.objects.filter(playlist=self.pl).exists())

    def test_post_slides_not_a_list_returns_400(self):
        resp = self.client.post(
            f"/api/v1/playlist/{self.pl.id}/slide/?display_type={self.dt.id}",
            {"name": "bad"}, format="json",
            **auth_header(self.token),
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nonexistent_playlist_returns_404(self):
        resp = self.client.get(
            "/api/v1/playlist/99999/slide/",
            **auth_header(self.token),
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
