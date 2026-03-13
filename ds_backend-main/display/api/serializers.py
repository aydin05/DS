from rest_framework.serializers import ModelSerializer
from display.models import DisplayType,DisplayGroup,Display
from rest_framework import serializers
from branch.models import Branch
from django.utils.translation import gettext_lazy as _


class DisplayTypeSerializer(ModelSerializer):
    class Meta:
        model = DisplayType
        fields = ("id", 'name', 'description', 'width', 'height', 'is_standart')

    
    def create(self, validated_data):
        validated_data.update({'company': self.context['request'].user.company})
        display_type = super().create(validated_data)
        return display_type

    def validate_name(self,attr):
        old_display_type = DisplayType.objects.filter(name__iexact=attr.strip(),company=self.context['request'].user.company)
        if self.instance:
            old_display_type = old_display_type.exclude(id=self.instance.id)
        if old_display_type.exists():
            raise serializers.ValidationError(_("Display type already exists!"))
        return attr


class DisplaySerializer(ModelSerializer):

    class Meta:
        model = Display
        fields = ("id", 'name', 'description', 'display_type', 'password','username','playlist','schedule','branch','display_group','notifications_enabled')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['display_group'].required = False
        self.fields['playlist'].required = False
        self.fields['schedule'].required = False

    def create(self, validated_data):   
        validated_data.update({'company': self.context['request'].user.company})
        display_group = validated_data.get('display_group')
        playlist = validated_data.get('playlist')
        schedule = validated_data.get('schedule')
        if (display_group and playlist) or (display_group and schedule) or (playlist and schedule):
            raise serializers.ValidationError("You can't create display with both playlist and schedule or playlist and display group")
        if not display_group and not playlist and not schedule:
            raise serializers.ValidationError("You must create display with playlist or schedule or display group")
        display = super().create(validated_data)
        return display
    
    def validate_username(self,value):
        old_display = Display.objects.filter(username__iexact = value)
        if self.instance:
            old_display = old_display.exclude(id=self.instance.id)
        if old_display.exists():
            raise serializers.ValidationError("Display with this username already exists")
        return value

    def validate_name(self,value):
        old_display = Display.objects.filter(name__iexact = value, company = self.context['request'].user.company)
        if self.instance:
            old_display = old_display.exclude(id=self.instance.id)
        if old_display.exists():
            raise serializers.ValidationError("Display with this name already exists")
        return value

    def update(self, instance, validated_data):
        # Allow partial updates (e.g. PATCH for notifications_enabled only)
        is_partial = self.partial
        assignment_keys = {'display_group', 'playlist', 'schedule'}
        if is_partial and not assignment_keys.intersection(validated_data.keys()):
            return super().update(instance, validated_data)

        display_group = validated_data.get('display_group', None)
        playlist = validated_data.get('playlist', None)
        schedule = validated_data.get('schedule', None)
        if not is_partial:
            validated_data.update({'playlist': playlist})
            validated_data.update({'display_group': display_group})
            validated_data.update({'schedule': schedule})
        if (display_group and playlist) or (display_group and schedule) or (playlist and schedule):
            raise serializers.ValidationError("You can't assign both playlist and schedule, or both playlist/schedule and display group")
        if not is_partial and not (display_group) and not (playlist) and not (schedule):
            raise serializers.ValidationError("You must assign a playlist, schedule, or display group")
        return super().update(instance, validated_data)

class DisplayGroupSerializer(ModelSerializer):
    display = serializers.SerializerMethodField()

    class Meta:
        model = DisplayGroup
        fields = ("id", 'name', 'description','playlist','schedule','display')

    # def create(self, validated_data):
    #     validated_data.update({'company': self.context['request'].user.company})
    #     display_group = super().create(validated_data)
    #     return display_group
    
    def get_display(self, obj):
        displays = obj.display_set.all()
        return DisplaySerializer(displays, many =True).data
    



# class DisplayGroupCreateSerializer(ModelSerializer):
#     class Meta:
#         model = DisplayGroup
#         fields = ("id", 'name', 'description','playlist','schedule','display_set')

#     def create(self, validated_data):
#         validated_data.update({'company': self.context['request'].user.company})
#         print(validated_data)
#         display_group = super().create(validated_data)
#         return display_group
    




class DisplayGroupCreateSerializer(ModelSerializer):
    class Meta:
        model = DisplayGroup
        fields = ("id", 'name', 'description','playlist','schedule','display_set')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['display_set'].required = False
        self.fields['playlist'].required = False
        self.fields['schedule'].required = False

    def validate_name(self, value):
        company = self.context['request'].user.company
        qs = DisplayGroup.objects.filter(name__iexact=value, company=company)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("Display group with this name already exists")
        return value

    def create(self, validated_data):
        display_set = validated_data.get('display_set')
        playlist = validated_data.get('playlist')
        schedule = validated_data.get('schedule')
        validated_data.update({'company': self.context['request'].user.company})
        if playlist and schedule:
            raise serializers.ValidationError("You can't create display group with both playlist and schedule")
        if not display_set and not playlist and not schedule:
            raise serializers.ValidationError("You must create display group with playlist, schedule, or displays")
        display_group = super().create(validated_data)
        return display_group
    
    def update(self, instance, validated_data):
        if 'playlist' not in validated_data and 'schedule' not in validated_data:
            return super().update(instance, validated_data)
        playlist = validated_data.get('playlist', None)
        schedule = validated_data.get('schedule', None)
        validated_data.update({'playlist': playlist})
        validated_data.update({'schedule': schedule})
        if playlist and schedule:
            raise serializers.ValidationError("You can't assign both playlist and schedule to a display group")
        if not playlist and not schedule:
            raise serializers.ValidationError("You must assign a playlist or schedule to the display group")
        return super().update(instance, validated_data)