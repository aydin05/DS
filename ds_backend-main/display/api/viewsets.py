from core.models import WidgetType
from display.models import *
from rest_framework import permissions, status
from display.api.serializers import DisplayTypeSerializer, DisplayGroupSerializer,DisplaySerializer,DisplayGroupCreateSerializer
from display.api.permissions import DisplayTypePermission,DisplayGroupPermission,DisplayPermission
from core.api.viewsets import MultiSerializerViewSet
from rest_framework.generics import ListAPIView
from rest_framework import filters
from playlist.api.serializers import PlaylistDetailSerializer
from rest_framework.response import Response
from playlist.models import Playlist
from dsqmeter.utils.display_helpers import get_playlist_id_for_display
from django.db.models import ProtectedError

class DisplayTypeViewSet(MultiSerializerViewSet):
    queryset = DisplayType.objects.all()
    multi_permissions = {
        'default': (permissions.IsAuthenticated, DisplayTypePermission,)
    }
    multi_serializers = {
        'default': DisplayTypeSerializer,
    }
    model = DisplayType
    filter_backends = [filters.SearchFilter]
    search_fields = ['name','description']

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Cannot delete this display type because it is used by one or more playlists. Please reassign those playlists first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    

class DisplayGroupViewSet(MultiSerializerViewSet):
    queryset = DisplayGroup.objects.all()
    multi_permissions = {
        'default': (permissions.IsAuthenticated, DisplayGroupPermission,)
    }
    multi_serializers = {
        'list': DisplayGroupSerializer,
        'create': DisplayGroupCreateSerializer,
        'default': DisplayGroupSerializer,
        'update': DisplayGroupCreateSerializer

    }
    filter_backends = [filters.SearchFilter]
    search_fields = ['name','description']
    model = DisplayGroup

    

class DisplayViewSet(MultiSerializerViewSet):
    queryset = Display.objects.all()
    multi_permissions = {
        'default': (permissions.IsAuthenticated, DisplayPermission,)
    }
    multi_serializers = {
        'default': DisplaySerializer,
    }
    model = Display
    filter_backends = [filters.SearchFilter]
    search_fields = ['name','description']

    
class UnAssignedDisplayApiView(ListAPIView):
    queryset = Display.objects.all()
    serializer_class = DisplaySerializer
    permission_classes = (permissions.IsAuthenticated, DisplayPermission,)
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.filter(display_group__isnull=True, company = self.request.user.company)


class DisplayDetailApiView(ListAPIView):
    queryset = Playlist.objects.all()
    serializer_class = PlaylistDetailSerializer


    def get(self, request, *args, **kwargs):
        username = request.GET.get('username')
        display = Display.objects.filter(username=username).last()
        if not display:
            return Response({"error": "Invalid username"}, status=400)
        playlist_id = get_playlist_id_for_display(display)
        if not playlist_id:
            return Response({"error": "Playlist not found please assign playlist display or others"}, status=400)
        playlist = Playlist.objects.filter(id=playlist_id).first()
        if not playlist:
            return Response({"error": "Playlist not found"}, status=404)
        # Always serve published Slide objects, NOT draft extra_fields.
        # Draft changes in extra_fields should only appear after user clicks Publish.
        playlist.slides = None
        serializer = PlaylistDetailSerializer(playlist, context={'request': request})
        return Response(serializer.data)