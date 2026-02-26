from typing import Iterable
from django.shortcuts import get_object_or_404
from rest_framework.serializers import ModelSerializer, SerializerMethodField
from rest_framework import serializers
from display.api.serializers import DisplayTypeSerializer
from core.models import WidgetType
from display.models import DisplayType
from rest_framework.exceptions import ValidationError,NotFound

from dsqmeter.settings import default_tz
from playlist.models import Playlist, Schedule, SchedulePlaylist, Slide, SlideItem, SlideItemDisplayType
from django.utils.translation import gettext_lazy as _


class PlaylistCreateSerializer(ModelSerializer):
    is_update = SerializerMethodField()
    class Meta:
        model = Playlist
        fields = ("id", 'name', 'description', 'default_display_type','extra_fields','is_update')

    def create(self, validated_data):
        validated_data.update({'company': self.context['request'].user.company})
        playlist = super().create(validated_data)
        return playlist
    
    def validate_name(self,value):
        old_playlist = Playlist.objects.filter(name__iexact=value, company=self.context['request'].user.company)
        if self.instance:
            old_playlist = old_playlist.exclude(id=self.instance.id)
        if old_playlist.exists():
            raise serializers.ValidationError("Playlist with this name already exists")
        return super().validate(value)
    
    def get_is_update(self, obj):
        is_update = False
        if isinstance(self.instance, Iterable):
            for playlist in self.instance:
                if playlist.extra_fields:
                    is_update = True
            return  is_update
        else:
            if self.instance.extra_fields:
                is_update = True
            return is_update




    # def update(self, instance, validated_data):
    #     validated_data['id'] = instance.id
    #     validated_data.update({'company': self.context['request'].user.company})
    #     print(validated_data)
    #     instance = instance['extra_fields'] = validated_data
    #     return instance


class PlaylistSerializer(ModelSerializer):
    default_display_type = serializers.SerializerMethodField()
    is_update = SerializerMethodField()
    class Meta:
        model = Playlist
        fields = ("id", 'name', 'description', 'default_display_type','extra_fields','is_update')

    def get_default_display_type(self, obj):
        return DisplayTypeSerializer(obj.default_display_type).data

    def update(self, instance, validated_data):
        instance.company = self.context['request'].user.company
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        display_type_id = self.context['request'].data.get('default_display_type')
        if display_type_id is not None:
            display_type = DisplayType.objects.filter(id=display_type_id).first()
            instance.default_display_type = display_type
        instance.save()
        return instance

    def get_is_update(self, obj):
        is_update = False
        if isinstance(self.instance, Iterable):
            if obj.extra_fields:
                is_update = True
                return is_update
            return  is_update
        else:
            if self.instance.extra_fields:
                is_update = True
            return is_update

class ScheduleSerializer(ModelSerializer):
    class Meta:
        model = Schedule
        fields = ("id", 'name', 'description', 'default_playlist')

    def create(self, validated_data):
        validated_data.update({'company': self.context['request'].user.company})
        schedule = super().create(validated_data)
        return schedule

    def validate_name(self,value):
        old_schedule = Schedule.objects.filter(name__iexact=value, company=self.context['request'].user.company)
        if self.instance:
            old_schedule = old_schedule.exclude(id=self.instance.id)
        if old_schedule.exists():
            raise serializers.ValidationError("Schedule with this name already exists")
        return super().validate(value)


class SchedulePlaylistSerializer(ModelSerializer):
    class Meta:
        model = SchedulePlaylist
        fields = ("id", 'playlist', 'name', 'description', 'start_time', 'end_time', 'repeat', 'repeat_type','is_all_day')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['start_time'] = instance.start_time.astimezone(default_tz).strftime("%Y-%m-%d %H:%M:%S")
        data['end_time'] = instance.end_time.astimezone(default_tz).strftime("%Y-%m-%d %H:%M:%S")
        return data

    def create(self, validated_data):
        schedule = get_object_or_404(Schedule, pk=self.context['view'].kwargs['schedule_id'])
        validated_data.update({'schedule': schedule})
        schedule_playlist = super().create(validated_data)
        return schedule_playlist


class SlideItemDisplayTypeSerializer(ModelSerializer):
    
    class Meta:
        model = SlideItemDisplayType
        fields = ('id','display_type','slide_item','top','left','width','height')
    
    def create(self,validated_data):
        slide_item_display_type = super().create(validated_data)
        return slide_item_display_type


class SlideItemSerializer(ModelSerializer):
    display_types = SerializerMethodField()
    type_content = SerializerMethodField()
    top = SerializerMethodField()
    left = SerializerMethodField()
    width = SerializerMethodField()
    height = SerializerMethodField()

    class Meta:
        model = SlideItem
        fields = ("id", 'type','type_content', 'slide','display_types', "top", "left", "width", "height", "index", "attr",)

    def create(self, validated_data):
        display_type = self.context['display_type']
        type_content = validated_data.get('type_content',None)
        if type_content:
            validated_data.pop('type_content')
        if "rows" in validated_data:
            validated_data.pop('rows')
        if "columns" in validated_data:
            validated_data.pop('columns')
        slide_item = super().create(validated_data)
        if type(display_type) == list:
            for display_type_item in display_type:
                display_type = DisplayType.objects.filter(id=display_type_item['id']).last()
                validated_data.update({'top': display_type_item['top']})
                validated_data.update({'left': display_type_item['left']})
                validated_data.update({'width': display_type_item['width']})
                validated_data.update({'height': display_type_item['height']})
                slide_item_display_type_data = {
                    'slide_item':slide_item,
                    'display_type':display_type,
                    'top':display_type_item['top'],
                    'left':display_type_item['left'],
                    'width':display_type_item['width'],
                    'height':display_type_item['height']
                }
                diplay_type_data = SlideItemDisplayTypeSerializer().create(slide_item_display_type_data)
        else:
            slide_item_display_type_data = {
            'slide_item':slide_item,
            'display_type':display_type,
            'top':validated_data.get('top'),
            'left':validated_data.get('left'),
            'width':validated_data.get('width'),
            'height':validated_data.get('height')
            }
            diplay_type_data = SlideItemDisplayTypeSerializer().create(slide_item_display_type_data)

        return slide_item

    def get_type_content(self, obj):
        return  obj.type.name

    def _get_cached_display_type_match(self, obj):
        """Return the cached SlideItemDisplayType matching the context display_type, or None."""
        cache_attr = '_sidt_match'
        if hasattr(obj, cache_attr):
            return getattr(obj, cache_attr)
        # This should already be populated by get_display_types which runs first
        return None

    def get_top(self, obj):
        match = self._get_cached_display_type_match(obj)
        if match:
            return match.top
        return obj.top

    def get_display_types(self,obj):
        # Use prefetched data if available, otherwise fall back to query
        if hasattr(obj, '_prefetched_objects_cache') and 'slideitemdisplaytype_set' in obj._prefetched_objects_cache:
            slide_item_display_types = obj._prefetched_objects_cache['slideitemdisplaytype_set']
        else:
            slide_item_display_types = obj.slideitemdisplaytype_set.all().select_related('display_type')
        display_type = self.context['display_type']
        display_types = []
        matched = None
        for sidt in slide_item_display_types:
            dt_id = sidt.display_type_id
            if display_type and str(dt_id) == str(display_type) or dt_id == display_type:
                matched = sidt
            display_types.append({
                'id': dt_id,
                "top": sidt.top,
                "left": sidt.left,
                "width": sidt.width,
                "height": sidt.height
            })
        # Cache the match on the object so get_top/left/width/height don't re-query
        obj._sidt_match = matched
        if not matched:
            obj.left = 0
            obj.top = 0
        return display_types


    def get_left(self, obj):
        match = self._get_cached_display_type_match(obj)
        if match:
            return match.left
        return obj.left

    def get_width(self, obj):
        match = self._get_cached_display_type_match(obj)
        if match:
            return match.width
        return obj.width

    def get_height(self, obj):
        match = self._get_cached_display_type_match(obj)
        if match:
            return match.height
        return obj.height
        
class SlideSerializer(ModelSerializer):
    items = SerializerMethodField()

    class Meta:
        model = Slide
        fields = ("id", 'name', 'position', 'duration', 'playlist', 'bg_color', 'items')

    def get_items(self, obj):
        slide_items = list(obj.slideitem_set.all().prefetch_related('slideitemdisplaytype_set__display_type'))
        display_type = self.context['display_type']
        for slide_item in slide_items:
            location = slide_item.attr.get('location', None)
            if not location:
                slide_item.attr = {**slide_item.attr, 'location': slide_item.attr.get('url', '')}
        return SlideItemSerializer(slide_items, many=True, context={'display_type': display_type}).data






class SlideCreateSerializer(ModelSerializer):
    class Meta:
        model = Slide
        fields = ("id", 'name', 'position', 'duration', 'bg_color', 'playlist')

    def create(self, validated_data, **kwargs):
        slide_items = self.context.get('items')
        
        slide = super().create(validated_data)
        display_type = self.context.get('display_type')
        is_publish = True
        if display_type != None:
            is_publish = False
        for slide_item in slide_items:
            display_types = []
            # if 'display-types' in slide_item:
            display_types = slide_item.pop('display_types')
            slide_item_type = WidgetType.objects.get(id=slide_item['type'])
            slide_item['slide'] = slide
            slide_item['type'] = slide_item_type
            if is_publish:
                SlideItemSerializer(slide_item,context={'display_type':display_types}).create(slide_item)
            else:
                SlideItemSerializer(slide_item,context = {'display_type':display_type}).create(slide_item)
        return slide


class SlideItemTypeSerializer(ModelSerializer):
    class Meta:
        model = WidgetType
        fields = ("id", 'name')


class PlaylistDetailSerializer(ModelSerializer):
    slides = serializers.SerializerMethodField()
    general = SerializerMethodField()

    class Meta:
        model = Playlist
        fields = ('general','slides')

    def get_slides(self, obj):
        if obj.slides:
            return obj.slides
        slide = obj.slide_set.all().order_by('position').prefetch_related(
            'slideitem_set__slideitemdisplaytype_set__display_type'
        )
        display_type = self.context['request'].GET.get('display_type')
        if not display_type:
            display_type = obj.default_display_type
        return SlideSerializer(slide,context={'display_type':display_type} ,many=True).data

    def get_general(self, obj):
        return {
            'id': obj.id,
            'name': obj.name,
            'description': obj.description,
            'default_display_type': obj.default_display_type.id,
            'width': obj.default_display_type.width,
            'height': obj.default_display_type.height,
        }



