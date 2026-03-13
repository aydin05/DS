from collections import OrderedDict
from django.db import models
from django.contrib.auth.models import Group
from rest_framework.viewsets import ModelViewSet
from rest_framework import permissions, status, generics, filters
from account.api.serializers import CompanyUserSerializer
from account.api.permissions import CompanyUserPermission
from core.api.permissions import CompanyFilePermission
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from django.contrib.auth.models import Permission
from rest_framework.generics import ListAPIView
from core.api.serializers import CompanyFileSerializer, GroupSerializer, WidgetTypeSerializer, DeviceLogSerializer, DeviceLogDetailSerializer, get_threshold_for_company, DEFAULT_DEVICE_HEALTHY_THRESHOLD_SECONDS
from core.models import CompanyFile, WidgetType, DeviceLog, CompanySettings
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import action
from rest_framework.viewsets import ReadOnlyModelViewSet
import json
import logging
import os
import re
from django.conf import settings
from rest_framework.views import APIView
from logging.handlers import RotatingFileHandler
from display.models import Display

# settings.LOGS_DIR burada kullanılacak
LOGS_BASE_DIR = getattr(settings, 'LOGS_DIR', os.path.join(settings.BASE_DIR, 'logs'))
if not os.path.exists(LOGS_BASE_DIR):
    os.makedirs(LOGS_BASE_DIR)
User = get_user_model()


class UserBelongsToCompanyPermission:
    user_belong_to_company_error_message = "Access denied"

    def check_permissions(self, request):
        super().check_permissions(request)
        try:
            if not request.user.company:
                self.permission_denied(
                    request, message=self.user_belong_to_company_error_message
                )
        except Exception:
            self.permission_denied(
                request, message=self.user_belong_to_company_error_message
            )


class MultiSerializerViewSet(UserBelongsToCompanyPermission, ModelViewSet):
    multi_serializers = {}
    multi_permissions = {
        'default': (permissions.AllowAny,)
    }
    model = None

    def get_permissions(self):
        return [permission() for permission in
                self.multi_permissions.get(self.action, self.multi_permissions['default'])]

    def get_serializer_class(self):
        return self.multi_serializers.get(self.action, self.multi_serializers['default'])

    def get_queryset(self):
        if self.model and self.request.user.is_authenticated:
            return self.model.objects.filter(company=self.request.user.company)
        if self.model:
            return self.model.objects.none()
        return super().get_queryset().none()



class CompanyUserViewSet(MultiSerializerViewSet):
    multi_serializers = {
        'default': CompanyUserSerializer,
    }
    multi_permissions = {
        'default': (permissions.IsAuthenticated, CompanyUserPermission,)
    }
    model = User
    filter_backends = [filters.SearchFilter]
    search_fields = ['fullname', 'email']
    ordering = ['fullname']

    def get_queryset(self):
        if self.model and self.request.user.is_authenticated:
            return self.model.objects.filter(company=self.request.user.company).order_by('fullname')
        return User.objects.none()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance and instance.is_master:
            message = "This action doesn't allowed!"
            return Response({'message': message}, status=status.HTTP_403_FORBIDDEN)
        super().destroy(request, *args, **kwargs)
        message = "User deleted successfully!"
        return Response({'message': message})

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        if user.is_master:
            return super().update(request, *args, **kwargs)
        elif instance and (not instance.is_admin and not instance.is_master and user.is_admin) or (instance.is_admin and user.is_admin and
                                                                        instance == user):
            return super().update(request, *args, **kwargs)
        else:
            message = "This action doesn't allowed!"
            return Response({'message': message}, status=status.HTTP_403_FORBIDDEN)


class GroupApiView(ListAPIView):
    serializer_class = GroupSerializer
    queryset = Group.objects.all()
    pagination_class = None

    def get_queryset(self):
        queryset = Group.objects.all().order_by('id')
        return queryset


class WidgetTypeApiView(ListAPIView):
    serializer_class = WidgetTypeSerializer
    queryset = WidgetType.objects.all()
    pagination_class = None

    def get_queryset(self):
        queryset = WidgetType.objects.filter(company=self.request.user.company)
        return queryset


class CompanyFileViewSet(MultiSerializerViewSet):
    multi_serializers = {
        'default': CompanyFileSerializer,
    }
    multi_permissions = {
        'default': (permissions.IsAuthenticated, CompanyFilePermission,)
    }
    model = CompanyFile
    pagination_class = None
    
    def get_queryset(self):
        if self.model and self.request.user.is_authenticated:
            return self.model.objects.filter(company=self.request.user.company).order_by('-created_at')
        return CompanyFile.objects.none()


def sanitize_filename(username):
    """Kullanıcı adından dosya adı için güvenli bir string oluşturur."""
    if not username:
        return "unknown_user"
    # Geçersiz karakterleri kaldır veya değiştir
    s_username = str(username).strip().replace(' ', '_')
    s_username = re.sub(r'(?u)[^-\w.]', '', s_username)
    return s_username if s_username else "invalid_user"


# Bounded cache for per-user loggers to prevent unbounded memory growth.
# When the cache exceeds MAX_USER_LOGGERS, the least-recently-used logger's
# handlers are closed and the entry is evicted.
MAX_USER_LOGGERS = 500
_user_loggers = OrderedDict()

def _evict_oldest_logger():
    """Remove and close the oldest cached user logger."""
    if _user_loggers:
        _, old_logger = _user_loggers.popitem(last=False)
        for handler in old_logger.handlers[:]:
            handler.close()
            old_logger.removeHandler(handler)

def get_user_logger(username):
    """Belirtilen kullanıcı için bir logger örneği alır veya oluşturur."""
    sanitized_username = sanitize_filename(username)
    logger_name = f"user_logs.{sanitized_username}"

    if logger_name in _user_loggers:
        _user_loggers.move_to_end(logger_name)
        return _user_loggers[logger_name]

    # Evict oldest if at capacity
    while len(_user_loggers) >= MAX_USER_LOGGERS:
        _evict_oldest_logger()

    user_logger = logging.getLogger(logger_name)
    user_logger.setLevel(logging.INFO)

    # Eğer bu logger için daha önce handler eklenmemişse ekle
    if not user_logger.handlers:
        log_file_path = os.path.join(LOGS_BASE_DIR, f"user_{sanitized_username}.log")

        handler = RotatingFileHandler(
            log_file_path,
            maxBytes=1024 * 1024 * 2,
            backupCount=2
        )
        formatter = logging.Formatter(settings.LOGGING['formatters']['tizen_user_log_format']['format'], style='{')
        handler.setFormatter(formatter)

        user_logger.addHandler(handler)
        user_logger.propagate = False

    _user_loggers[logger_name] = user_logger
    return user_logger


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def _authenticate_display(username, password):
    """Validate display credentials. Returns Display or None."""
    if not username or not password:
        return None
    return Display.objects.filter(username=username, password=password).last()


def _update_heartbeat(display, source='unknown'):
    """Update the Display's last_heartbeat timestamp and ensure a DeviceLog exists."""
    now = timezone.now()
    Display.objects.filter(pk=display.pk).update(
        last_heartbeat=now,
        last_heartbeat_source=source,
    )
    # Ensure a DeviceLog record exists so the device appears in the status list
    # (OpenLink displays don't send logs, only heartbeats)
    if not DeviceLog.objects.filter(device=display, company=display.company).exists():
        DeviceLog.objects.create(
            device=display,
            company=display.company,
            message='',
            level='INFO',
        )


class HeartbeatAPIView(APIView):
    """
    Lightweight heartbeat endpoint for both Tizen and OpenLink clients.
    POST /core/heartbeat/

    Tizen:    {"username": "...", "password": "...", "source": "tizen"}
    OpenLink: {"username": "...", "source": "openlink"}  (password optional — OpenLink is public)
    """

    def post(self, request, *args, **kwargs):
        payload = request.data
        username = payload.get('username')
        password = payload.get('password', '')
        source = payload.get('source', 'unknown')

        if not username:
            return Response(
                {"error": "username is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Public player pages (OpenLink, TV Player, Tizen widget iframe) don't have
        # the display password, so we allow username-only heartbeats for these sources.
        if source in ('openlink', 'tv-player', 'tizen', 'android-tv'):
            display = Display.objects.filter(username=username).last()
        else:
            if not password:
                return Response(
                    {"error": "password is required for non-openlink sources."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            display = _authenticate_display(username, password)

        if not display:
            return Response(
                {"error": "Display not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        _update_heartbeat(display, source)
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


class LogReceiverAPIView(APIView):
    """
    Tizen cihazlarından gelen logları alır ve her kullanıcı için ayrı dosyaya yazar.
    Authenticates via display username/password in the payload.
    """

    def post(self, request, *args, **kwargs):
        try:
            payload = request.data  # DRF, JSON'u otomatik olarak request.data'ya parse eder
        except Exception as e:  # json.JSONDecodeError yerine daha genel bir hata yakalama
            default_logger = logging.getLogger(__name__)
            default_logger.warning(f"Invalid payload structure or non-JSON data: {e}",
                                   extra={'ip_address': get_client_ip(request)})
            return Response({"error": "Invalid payload structure or non-JSON data."},
                            status=status.HTTP_400_BAD_REQUEST)

        device_id = payload.get('deviceId', 'N/A')
        username = payload.get('username')
        password = payload.get('password', '')
        logs_data = payload.get('logs')

        if not username:
            return Response({"error": "Username is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(logs_data, list):
            return Response({"error": "Missing 'logs' array in payload."}, status=status.HTTP_400_BAD_REQUEST)

        # Authenticate the display
        display = _authenticate_display(username, password)
        if not display:
            # Fallback: allow without password for backward compatibility, but log a warning
            display = Display.objects.filter(username=username).last()
            if not display:
                return Response({"error": "Display not found."}, status=status.HTTP_404_NOT_FOUND)

        # Update heartbeat on every log submission
        source = payload.get('source', 'tizen')
        _update_heartbeat(display, source)

        user_logger = get_user_logger(username)  # Kullanıcıya özel logger'ı al/oluştur
        client_ip = get_client_ip(request)
        processed_log_count = 0
        all_log_lines = []
        level_str = ""
        for log_item in logs_data:
            timestamp_str = log_item.get('timestamp', 'N/A')
            level_str = log_item.get('level', 'INFO').upper()
            message = log_item.get('message', '')
            data_obj = log_item.get('data', {})

            log_message_content = f"DeviceTS:{timestamp_str} IP:{client_ip} DeviceID:{device_id} :: {message}"
            if data_obj:
                try:
                    data_str = json.dumps(data_obj)
                    if len(data_str) > 500:
                        data_str = data_str[:500] + "..."
                    log_message_content += f" DATA:{data_str}"
                except TypeError:
                    log_message_content += " DATA:(Serialization Error)"

            all_log_lines.append(log_message_content)

            if level_str == 'DEBUG':
                user_logger.debug(log_message_content)
            elif level_str == 'INFO':
                user_logger.info(log_message_content)
            elif level_str == 'WARN':
                user_logger.warning(log_message_content)
            elif level_str == 'ERROR':
                user_logger.error(log_message_content)
            else:
                user_logger.info(f"UnknownLevel:{level_str} {log_message_content}")

            processed_log_count += 1

        batch_message = "\n".join(all_log_lines)
        # Use filter().first() instead of get_or_create to avoid MultipleObjectsReturned
        device_log = DeviceLog.objects.filter(device=display, company=display.company).first()
        if device_log:
            # Keep last batch + previous (capped at 10000 chars to prevent DB bloat)
            combined = (device_log.message + "\n" + batch_message) if device_log.message else batch_message
            if len(combined) > 10000:
                combined = combined[-10000:]
            device_log.message = combined
            device_log.level = level_str
            device_log.save(update_fields=["message", "level", "updated_at"])
        else:
            DeviceLog.objects.create(
                device=display,
                company=display.company,
                message=batch_message,
                level=level_str,
            )

        return Response(
            {"status": "success", "message": f"{processed_log_count} logs processed for user '{username}'."},
            status=status.HTTP_201_CREATED
        )


class DeviceLogViewSet(ReadOnlyModelViewSet):
    """
    GET /core/logs/          → list all device logs (paginated, searchable, filterable by status)
    GET /core/logs/{id}/     → detail view with log lines
    GET /core/logs/{id}/download/ → return path to the log file for download

    Status filtering now uses Display.last_heartbeat (set by both Tizen and OpenLink clients).
    """
    permission_classes = (permissions.IsAuthenticated,)
    filter_backends = [filters.SearchFilter]
    search_fields = ['device__username', 'device__name']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DeviceLogDetailSerializer
        return DeviceLogSerializer

    def get_queryset(self):
        qs = DeviceLog.objects.filter(
            company=self.request.user.company
        ).select_related('device').order_by('-device__last_heartbeat')

        status_param = self.request.query_params.get('status')
        if status_param is not None:
            threshold_sec = get_threshold_for_company(self.request.user.company)
            threshold = timezone.now() - timedelta(seconds=threshold_sec)
            if status_param.lower() == 'true':
                qs = qs.filter(device__last_heartbeat__gte=threshold)
            elif status_param.lower() == 'false':
                qs = qs.filter(
                    models.Q(device__last_heartbeat__lt=threshold) |
                    models.Q(device__last_heartbeat__isnull=True)
                )
        return qs

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({"data": serializer.data})

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        instance = self.get_object()
        username = instance.device.username
        sanitized = sanitize_filename(username)
        log_file_path = os.path.join(LOGS_BASE_DIR, f"user_{sanitized}.log")
        if os.path.exists(log_file_path):
            from django.http import FileResponse
            return FileResponse(
                open(log_file_path, 'rb'),
                as_attachment=True,
                filename=f"user_{sanitized}.log",
            )
        return Response(
            {"error": "Log file not found."},
            status=status.HTTP_404_NOT_FOUND
        )


class CompanySettingsAPIView(APIView):
    """
    GET  /core/company-settings/  → return current threshold
    PUT  /core/company-settings/  → update threshold
    """
    permission_classes = (permissions.IsAuthenticated,)

    def _get_or_create(self, company):
        obj, _ = CompanySettings.objects.get_or_create(
            company=company,
            defaults={'heartbeat_threshold_seconds': DEFAULT_DEVICE_HEALTHY_THRESHOLD_SECONDS},
        )
        return obj

    def get(self, request):
        obj = self._get_or_create(request.user.company)
        return Response({'heartbeat_threshold_seconds': obj.heartbeat_threshold_seconds})

    def put(self, request):
        try:
            value = int(request.data.get('heartbeat_threshold_seconds'))
        except (TypeError, ValueError):
            return Response(
                {'error': 'heartbeat_threshold_seconds must be an integer.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        valid = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300]
        if value not in valid:
            return Response(
                {'error': f'Invalid value. Must be one of: {valid}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        obj = self._get_or_create(request.user.company)
        obj.heartbeat_threshold_seconds = value
        obj.save(update_fields=['heartbeat_threshold_seconds'])
        return Response({'heartbeat_threshold_seconds': obj.heartbeat_threshold_seconds})
