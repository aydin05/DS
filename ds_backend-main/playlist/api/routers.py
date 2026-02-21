from rest_framework.routers import DefaultRouter
from playlist.api.viewsets import PlaylistViewSet,ScheduleViewSet,SchedulePlaylistViewSet


router = DefaultRouter()

router.register(r'playlist', PlaylistViewSet,basename='playlist')
router.register(r'schedule', ScheduleViewSet,basename='schedule')
router.register(r'^(?P<schedule_id>\d+)/schedule-playlist', SchedulePlaylistViewSet,basename='schedule-playlist')