from core.api.permissions import CustomAccessPermission
from django.utils.translation import gettext_lazy as _


class PlaylistPermission(CustomAccessPermission):
    message = _('No action is allowed on the user.')
    permission = 'playlist'
    permission_model = 'playlist'


class SchedulePermission(CustomAccessPermission):
    message = _('No action is allowed on the user.')
    permission = 'schedule'
    permission_model = 'schedule'


class SchedulePlaylistPermission(CustomAccessPermission):
    message = _('No action is allowed on the user.')
    permission = 'schedule_playlist'
    permission_model = 'schedule_playlist'


class SlidePermission(CustomAccessPermission):
    message = _('No action is allowed on the user.')
    permission = 'slide'
    permission_model = 'slide'

