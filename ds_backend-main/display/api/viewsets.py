from core.models import WidgetType
from display.models import *
from rest_framework import permissions
from display.api.serializers import DisplayTypeSerializer, DisplayGroupSerializer,DisplaySerializer,DisplayGroupCreateSerizalier
from display.api.permissions import DisplayTpyePermission,DisplayGroupPermission,DisplayPermission
from core.api.viewsets import MultiSerializerViewSet
from rest_framework.generics import ListAPIView
from rest_framework import filters
from django.shortcuts import get_object_or_404
from playlist.api.serializers import PlaylistDetailSerializer
from rest_framework.response import Response
from playlist.models import Playlist

class DisplayTypeViewSet(MultiSerializerViewSet):
    queryset = DisplayType.objects.all()
    multi_permissions = {
        'default': (permissions.IsAuthenticated, DisplayTpyePermission,)
    }
    multi_serializers = {
        'default': DisplayTypeSerializer,
    }
    model = DisplayType
    filter_backends = [filters.SearchFilter]
    search_fields = ['name','description']

    

class DisplayGroupViewSet(MultiSerializerViewSet):
    queryset = DisplayGroup.objects.all()
    multi_permissions = {
        'default': (permissions.IsAuthenticated, DisplayGroupPermission,)
    }
    multi_serializers = {
        'list': DisplayGroupSerializer,
        'create': DisplayGroupCreateSerizalier,
        'default': DisplayGroupSerializer,
        'update': DisplayGroupCreateSerizalier

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
        if display:
            if display.playlist:
                playlist_id = display.playlist.id 
            elif display.display_group and display.display_group.playlist:
                playlist_id = display.display_group.playlist.id
            elif  display.display_group and display.display_group.schedule:
                playlist_id = display.display_group.schedule.default_playlist.id
            elif display.schedule:
                playlist_id = display.schedule.default_playlist.id
            else: 
                return Response({"error": "Playlist not found please assign playlist display or others"}, status=400)
            playlist = get_object_or_404(Playlist, id = playlist_id)
            # Always serve published Slide objects, NOT draft extra_fields.
            # Draft changes in extra_fields should only appear after user clicks Publish.
            playlist.slides = None
            serializer = PlaylistDetailSerializer(playlist, context={'request': request})
            return Response(serializer.data)
        return Response({"error": "Invalid username"}, status=400)