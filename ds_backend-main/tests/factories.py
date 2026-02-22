"""
Shared test factories for creating common objects across all test modules.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from account.models import Company, RoleGroup, GroupCustom
from branch.models import Branch
from display.models import DisplayType, DisplayGroup, Display
from playlist.models import Playlist, Schedule, Slide
from core.models import WidgetType
from knox.models import AuthToken as KnoxAuthToken

User = get_user_model()


def create_company(name="Test Company"):
    return Company.objects.create(name=name)


def create_user(company, email="user@test.com", password="TestPass123!", is_admin=False, is_master=False):
    user = User.objects.create_user(
        email=email,
        password=password,
        company=company,
        fullname="Test User",
        is_admin=is_admin,
        is_master=is_master,
    )
    return user


def create_auth_token(user):
    """Create a Knox token and return the raw token string."""
    _, token = KnoxAuthToken.objects.create(user)
    return token


def create_branch(company, name="Test Branch"):
    return Branch.objects.create(name=name, company=company)


def create_display_type(company, name="FHD", width=1920, height=1080):
    return DisplayType.objects.create(
        name=name, width=width, height=height, company=company
    )


def create_display_group(company, name="Test Group", playlist=None, schedule=None):
    return DisplayGroup.objects.create(
        name=name, company=company, playlist=playlist, schedule=schedule
    )


def create_display(company, branch, display_type, name="Display 1", username="display1", password="pass123"):
    return Display.objects.create(
        name=name,
        username=username,
        password=password,
        display_type=display_type,
        branch=branch,
        company=company,
    )


def create_playlist(company, display_type, name="Test Playlist"):
    return Playlist.objects.create(
        name=name,
        description="Test description",
        company=company,
        default_display_type=display_type,
    )


def create_schedule(company, playlist, name="Test Schedule"):
    return Schedule.objects.create(
        name=name,
        company=company,
        default_playlist=playlist,
    )


def create_widget_type(company, name="text", label="Text Widget"):
    return WidgetType.objects.create(
        name=name, label=label, company=company, attr={}
    )


def create_slide(playlist, company, name="Slide 1", position=0, duration=5):
    return Slide.objects.create(
        name=name,
        position=position,
        duration=duration,
        playlist=playlist,
        company=company,
        bg_color="#ffffff",
    )


def create_group_with_code(name, code):
    """Create a Django auth Group with a GroupCustom code for permission checks."""
    group = Group.objects.create(name=name)
    GroupCustom.objects.create(group=group, code=code)
    return group


def create_role_group(company, name="Test Role", groups=None):
    rg = RoleGroup.objects.create(name=name, company=company)
    if groups:
        rg.role.set(groups)
    return rg


def auth_header(token):
    """Return the Authorization header dict for Knox token auth."""
    return {"HTTP_AUTHORIZATION": f"Token {token}"}
