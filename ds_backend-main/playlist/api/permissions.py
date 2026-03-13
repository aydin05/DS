from core.api.permissions import CustomAccessPermission
from django.utils.translation import gettext_lazy as _


class PlaylistPermission(CustomAccessPermission):
    message = _('You do not have permission to manage playlists.')
    permission = 'playlist'
    permission_model = 'playlist'


class SchedulePermission(CustomAccessPermission):
    message = _('You do not have permission to manage schedules.')
    permission = 'schedule'
    permission_model = 'playlist'


class SchedulePlaylistPermission(CustomAccessPermission):
    message = _('You do not have permission to manage schedule playlists.')
    permission = 'scheduleplaylist'
    permission_model = 'playlist'


class SlidePermission(CustomAccessPermission):
    message = _('You do not have permission to manage slides.')
    permission = 'slide'
    permission_model = 'playlist'

