import requests
from display.models import Display
from playlist.models import *
from rest_framework import permissions
from playlist.api.serializers import PlaylistSerializer,ScheduleSerializer,SchedulePlaylistSerializer, SlideItemDisplayTypeSerializer,SlideSerializer,SlideItemSerializer,SlideCreateSerializer,PlaylistDetailSerializer,PlaylistCreateSerializer
from playlist.api.permissions import PlaylistPermission,SchedulePermission, SchedulePlaylistPermission,SlidePermission
from core.api.viewsets import MultiSerializerViewSet
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from rest_framework import filters
from rest_framework.decorators import action
import copy



class PlaylistViewSet(MultiSerializerViewSet):
    queryset = Playlist.objects.all()
    serializer_class = PlaylistSerializer
    multi_permissions = {
        'default': (permissions.IsAuthenticated, PlaylistPermission,)
    }
    multi_serializers = {
        'list': PlaylistSerializer,
        'default': PlaylistSerializer,
        'create': PlaylistCreateSerializer,
        'update':PlaylistSerializer
    }
    model = Playlist
    filter_backends = [filters.SearchFilter]
    search_fields = ['name','description']

    def get_queryset(self):
        queryset = super().get_queryset().order_by('-created_at')
        return queryset.filter(company = self.request.user.company)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        playlist = self.get_object()
        if playlist.extra_fields == []:
            return Response({"error": "You must add slides to this playlist"}, status=400)
        playlist.slide_set.all().delete()
        for slide in playlist.extra_fields:
            slide['playlist'] = playlist.id
            slide['company'] = request.user.company.id
            serializer = SlideCreateSerializer(data=slide, context={'request': request, 'items': slide['items']})
            if serializer.is_valid():
                serializer.save(company=request.user.company)
                continue
            return Response(serializer.errors, status=400)
        playlist.extra_fields = []
        playlist.save()
        return Response({"message": "Playlist published"})

    @action(detail=True, methods=['post'])
    def discard(self, request, pk=None):
        playlist = self.get_object()
        playlist.extra_fields = []
        playlist.save()
        return Response({"message": "Playlist discarded"})

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def duplicate(self, request, pk=None):
        original = self.get_object()
        company = request.user.company

        # Deep copy extra_fields JSON
        new_extra_fields = copy.deepcopy(original.extra_fields) if original.extra_fields else []

        # Create duplicated playlist
        new_playlist = Playlist.objects.create(
            name="Copy of {}".format(original.name),
            description=original.description,
            company=company,
            default_display_type=original.default_display_type,
            extra_fields=new_extra_fields,
        )

        # Duplicate all slides and their items
        for slide in original.slide_set.all().order_by('position'):
            old_slide_id = slide.id
            slide_items = list(slide.slideitem_set.all())

            new_slide = Slide.objects.create(
                name=slide.name,
                position=slide.position,
                duration=slide.duration,
                playlist=new_playlist,
                company=company,
                bg_color=slide.bg_color,
            )

            for item in slide_items:
                display_types = list(SlideItemDisplayType.objects.filter(slide_item=item))

                new_item = SlideItem.objects.create(
                    type=item.type,
                    slide=new_slide,
                    top=item.top,
                    left=item.left,
                    width=item.width,
                    height=item.height,
                    index=item.index,
                    attr=copy.deepcopy(item.attr) if item.attr else {},
                )

                for dt in display_types:
                    SlideItemDisplayType.objects.create(
                        slide_item=new_item,
                        display_type=dt.display_type,
                        top=dt.top,
                        left=dt.left,
                        width=dt.width,
                        height=dt.height,
                    )

        serializer = PlaylistSerializer(new_playlist, context={'request': request})
        return Response(serializer.data)

class ScheduleViewSet(MultiSerializerViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
    multi_permissions = {
        'default': (permissions.IsAuthenticated, SchedulePermission,)
    }
    multi_serializers = {
        'default': ScheduleSerializer,
    }
    model = Schedule
    filter_backends = [filters.SearchFilter]
    search_fields = ['name','description']
    
    def get_queryset(self):
        queryset = super().get_queryset().order_by('-created_at')
        return queryset.filter(company = self.request.user.company)



class SchedulePlaylistViewSet(MultiSerializerViewSet):
    queryset = SchedulePlaylist.objects.all()
    serializer_class = SchedulePlaylistSerializer
    pagination_class = None
    multi_permissions = {
        'default': (permissions.IsAuthenticated, SchedulePlaylistPermission,)
    }
    multi_serializers = {
        'default': SchedulePlaylistSerializer,
    }
    model = SchedulePlaylist

    def get_queryset(self):
        queryset = SchedulePlaylist.objects.filter(schedule_id=self.kwargs['schedule_id'])
        return queryset


class SlideApiView(APIView):
    queryset = Slide.objects.all()
    serializer_class = SlideSerializer
    permission_classes = (permissions.IsAuthenticated, SlidePermission,)

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        playlist = Playlist.objects.filter(pk=kwargs['id'], company=request.user.company).first()
        if not playlist:
            return Response({"error": "Playlist not found"}, status=404)
        response_data = []

        if not isinstance(self.request.data, list):
            return Response({"error": "Slides must be a list"}, status=400)

        display_type_id = request.GET.get('display_type')
        display_type_obj = DisplayType.objects.filter(id=display_type_id).last()

       
        if not playlist.slide_set.exists():
            for slide in self.request.data:
                slide['playlist'] = playlist.id
                slide['company'] = self.request.user.company.id

                for item in slide.get("items", []):
                    widget_type = WidgetType.objects.filter(id=item["type"]).first()
                    if widget_type and widget_type.name == "table":
                        item["columns"] = slide.get("columns", [])
                        item["rows"] = slide.get("rows", [])
                
                serializer = SlideCreateSerializer(
                    data=slide,
                    context={'request': request, 'items': slide['items'], 'display_type': display_type_obj}
                )

                if serializer.is_valid():
                    serializer.save(company=self.request.user.company)
                    response_data.append(
                        SlideSerializer(serializer.instance, context={'request': request, "display_type": display_type_obj}).data
                    )
                    continue
                return Response(serializer.errors)

        else:
            request_data = self.request.data
            for data in request_data:
                for item in data['items']:
                    item['type_content'] = WidgetType.objects.filter(id=item['type']).first().name

                    if item['type_content'] == "table":
                        item['columns'] = data.get("columns", [])
                        item['rows'] = data.get("rows", [])

                    if 'display_types' in item:
                        is_exist = False
                        for display_type in item['display_types']:
                            if int(display_type_id) == int(display_type['id']):
                                is_exist = True
                                display_type['top'] = item['top']
                                display_type['left'] = item['left']
                                display_type['width'] = item['width']
                                display_type['height'] = item['height']
                        
                        if not is_exist:
                            item['display_types'].append({
                                'id': display_type_obj.id,
                                'top': item['top'],
                                'left': item['left'],
                                'width': item['width'],
                                'height': item['height'],
                            })
                    else:
                        item['display_types'] = [{
                            'id': display_type_id,
                            'top': item['top'],
                            'left': item['left'],
                            'width': item['width'],
                            'height': item['height'],
                        }]

            newlist = sorted(self.request.data, key=lambda d: d['position'])
            playlist.extra_fields = newlist
            playlist.save(update_fields=['extra_fields'])
            return Response({'success': True})

        return Response(response_data)
    
    def get(self, request, *args, **kwargs):
        playlist = Playlist.objects.filter(pk=kwargs['id'], company=request.user.company).first()
        if not playlist:
            return Response({"error": "Playlist not found"}, status=404)
        playlist_data = PlaylistSerializer(playlist, context={'request': request}).data
        if playlist_data['is_update'] == True:
            return Response(playlist.extra_fields)
        queryset = Slide.objects.filter(company=self.request.user.company, playlist=playlist)
        serializer = SlideSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)



class PlaylistDetailApiView(APIView):
    queryset = Playlist.objects.all()
    serializer_class = PlaylistDetailSerializer


    def get(self, request, *args, **kwargs):
        if request.user and request.user.is_authenticated:
            id = request.GET.get('id')
            display_type = request.GET.get('display_type')
            playlist = Playlist.objects.filter(pk=id).first()
            if not playlist:
                return Response({"error": "Playlist not found"}, status=404)
            list_of_data = copy.deepcopy(playlist.extra_fields)
            for data in list_of_data:
                for item in data['items']:
                    is_exist = False
                    for display_type_item in item['display_types']:
                        if int(display_type) == int(display_type_item['id']):
                            is_exist = True
                            item['top'] = display_type_item['top']
                            item['left'] = display_type_item['left']
                            item['width'] = display_type_item['width']
                            item['height'] = display_type_item['height']
                    if not is_exist:
                        item['top'] = 0
                        item['left'] = 0
                        item['width'] = 200
                        item['height'] = 200

            playlist.slides = list_of_data
            serializer = PlaylistDetailSerializer(playlist, context={'request': request})
            return Response(serializer.data)
        return Response({"error": "You must be logged in to access this playlist"}, status=400)

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        if username and password:
            display = Display.objects.filter(username=username, password=password)
            if display:
                display = display.first()
                if display.playlist:
                    playlist_id = display.playlist.id 
                elif display.display_group and display.display_group.playlist:
                    playlist_id = display.display_group.playlist.id
                elif  display.display_group and  display.display_group.schedule:
                    playlist_id = display.display_group.schedule.default_playlist.id
                elif display.schedule:
                    playlist_id = display.schedule.default_playlist.id
                else: 
                    return Response({"error": "Playlist not found please assign playlist display or others"}, status=400)
                playlist = Playlist.objects.filter(id = playlist_id).last()
                playlist.slides = None
                serializer = PlaylistDetailSerializer(playlist, context={'request': request})
                data = serializer.data
                return Response(data)
            return Response({"error": "Invalid username or password"}, status=400)
        elif username and not password:
            display = Display.objects.filter(username=username).last()
            if not display:
                return Response({"error": "Display not found"}, status=400)
            if display.playlist:
                playlist_id = display.playlist.id 
            elif display.display_group and display.display_group.playlist:
                playlist_id = display.display_group.playlist.id
            elif display.display_group and display.display_group.schedule:
                playlist_id = display.display_group.schedule.default_playlist.id
            elif display.schedule:
                playlist_id = display.schedule.default_playlist.id
            else: 
                return Response({"error": "Playlist not found please assign playlist display or others"}, status=400)
            playlist = Playlist.objects.filter(id=playlist_id).last()
            playlist.slides = None
            serializer = PlaylistDetailSerializer(playlist, context={'request': request})
            data = serializer.data
        else:
            return Response({"error": "You must provide a username and password"}, status=400)
        return Response(data)





class TabloTicketApiView(APIView):

    def get(self, request, *args, **kwargs):
        try:
            if "url" not in request.query_params or "username" not in request.query_params:
                return Response({"error": "Url, username are required"}, status=400)
            url = request.query_params.get("url") + "/trusted"
            payload = {'username': request.query_params.get("username")}
            r = requests.post(url, data=payload, verify=False, timeout=10)
            if r.text == -1:
                return Response({"error": "Something went wrong"}, status=400)
            return Response({"ticket_id": r.text}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

