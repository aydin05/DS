from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from branch.models import Branch
from django.contrib.auth.models import Permission,Group
from django.utils import timezone
from core.models import WidgetType, CompanyFile, DeviceLog
from display.models import Display



class BranchSerializer(ModelSerializer):
    class Meta:
        model = Branch
        fields = ("id", 'name', 'description', 'timezone', 'company')


class GroupSerializer(ModelSerializer):
    class Meta:
        model = Group
        fields = ("id", 'name')
    

class WidgetTypeSerializer(ModelSerializer):
    class Meta:
        model = WidgetType
        fields = ("id", 'name', 'label','attr','company')


DEFAULT_DEVICE_HEALTHY_THRESHOLD_SECONDS = 120
# Keep this constant for backward compatibility with background.py imports
DEVICE_HEALTHY_THRESHOLD_SECONDS = DEFAULT_DEVICE_HEALTHY_THRESHOLD_SECONDS


def get_threshold_for_company(company):
    """Return the heartbeat threshold in seconds for the given company."""
    from core.models import CompanySettings
    try:
        return company.settings.heartbeat_threshold_seconds
    except Exception:
        return DEFAULT_DEVICE_HEALTHY_THRESHOLD_SECONDS


class DisplayNestedSerializer(ModelSerializer):
    class Meta:
        model = Display
        fields = ('id', 'name', 'branch', 'playlist')


class DeviceLogSerializer(ModelSerializer):
    device_username = serializers.CharField(source='device.username', read_only=True)
    display = DisplayNestedSerializer(source='device', read_only=True)
    is_healthy = serializers.SerializerMethodField()
    last_heartbeat = serializers.DateTimeField(source='device.last_heartbeat', read_only=True)
    last_heartbeat_source = serializers.CharField(source='device.last_heartbeat_source', read_only=True)

    class Meta:
        model = DeviceLog
        fields = ('id', 'device_username', 'display', 'is_healthy', 'last_heartbeat', 'last_heartbeat_source', 'message', 'level', 'created_at', 'updated_at')

    def get_is_healthy(self, obj):
        heartbeat = getattr(obj.device, 'last_heartbeat', None) if obj.device else None
        if not heartbeat:
            return False
        company = getattr(obj, 'company', None) or getattr(obj.device, 'company', None)
        threshold = get_threshold_for_company(company) if company else DEFAULT_DEVICE_HEALTHY_THRESHOLD_SECONDS
        diff = (timezone.now() - heartbeat).total_seconds()
        return diff <= threshold


class DeviceLogDetailSerializer(ModelSerializer):
    logs = serializers.SerializerMethodField()
    device_username = serializers.CharField(source='device.username', read_only=True)
    is_healthy = serializers.SerializerMethodField()
    last_heartbeat = serializers.DateTimeField(source='device.last_heartbeat', read_only=True)
    last_heartbeat_source = serializers.CharField(source='device.last_heartbeat_source', read_only=True)

    class Meta:
        model = DeviceLog
        fields = ('id', 'device_username', 'is_healthy', 'last_heartbeat', 'last_heartbeat_source', 'logs', 'level', 'created_at', 'updated_at')

    def get_is_healthy(self, obj):
        heartbeat = getattr(obj.device, 'last_heartbeat', None) if obj.device else None
        if not heartbeat:
            return False
        company = getattr(obj, 'company', None) or getattr(obj.device, 'company', None)
        threshold = get_threshold_for_company(company) if company else DEFAULT_DEVICE_HEALTHY_THRESHOLD_SECONDS
        diff = (timezone.now() - heartbeat).total_seconds()
        return diff <= threshold

    def get_logs(self, obj):
        if obj.message:
            return obj.message.split('\n')
        return []


class CompanyFileSerializer(ModelSerializer):
    class Meta:
        model = CompanyFile
        fields = ("id", 'file','type','duration')

    def validate(self, attrs):
        file_obj = attrs.get('file')
        file_type = attrs.get('type', '')
        if file_obj and file_type == 'video':
            from core.validators import transcode_video_if_needed
            attrs['file'] = transcode_video_if_needed(file_obj)
        return attrs

    def create(self, validated_data):
        validated_data.update({'company': self.context['request'].user.company})
        company_file = super().create(validated_data)
        return company_file