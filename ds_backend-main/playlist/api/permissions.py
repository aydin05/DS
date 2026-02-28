from core.api.permissions import CustomAccessPermission
from django.utils.translation import gettext_lazy as _


class PlaylistPermission(CustomAccessPermission):
    message = _('You do not have permission to manage playlists.')
    permission = 'playlist'
    permission_model = 'playlist'


class SchedulePermission(CustomAccessPermission):
    message = _('You do not have permission to manage schedules.')
    permission = 'schedule'
    permission_model = 'schedule'


class SchedulePlaylistPermission(CustomAccessPermission):
    message = _('You do not have permission to manage schedule playlists.')
    permission = 'schedule_playlist'
    permission_model = 'schedule_playlist'


class SlidePermission(CustomAccessPermission):
    message = _('You do not have permission to manage slides.')
    permission = 'slide'
    permission_model = 'slide'

