from rest_framework import permissions, status, filters
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.decorators import action
from notification.models import (
    EmailConfig, EmailTemplate, RecipientList, Recipient, NotificationSetting
)
from notification.api.serializers import (
    EmailConfigSerializer, EmailTemplateSerializer,
    RecipientListSerializer, RecipientCreateSerializer,
    RecipientSerializer, NotificationSettingSerializer
)


class EmailConfigViewSet(ModelViewSet):
    """CRUD for company SMTP configuration. One per company."""
    serializer_class = EmailConfigSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return EmailConfig.objects.filter(company=self.request.user.company)

    @action(detail=True, methods=['post'], url_path='test')
    def test_connection(self, request, pk=None):
        """Send a test email to verify email settings."""
        config = self.get_object()
        from notification.email_sender import send_email
        to_email = request.user.email or config.username
        success, error = send_email(
            config,
            to_emails=[to_email],
            subject='DS - Test Email',
            body='This is a test email from Digital Signage notification system.',
        )
        if success:
            return Response({"status": f"Test email sent to {to_email}"})
        return Response(
            {"error": error or "Unknown error"},
            status=status.HTTP_400_BAD_REQUEST
        )


class EmailTemplateViewSet(ModelViewSet):
    """CRUD for email templates."""
    serializer_class = EmailTemplateSerializer
    permission_classes = (permissions.IsAuthenticated,)
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'subject']

    def get_queryset(self):
        return EmailTemplate.objects.filter(company=self.request.user.company)


class RecipientListViewSet(ModelViewSet):
    """CRUD for recipient lists."""
    serializer_class = RecipientListSerializer
    permission_classes = (permissions.IsAuthenticated,)
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        return RecipientList.objects.filter(
            company=self.request.user.company
        ).prefetch_related('recipients')


class RecipientViewSet(ModelViewSet):
    """CRUD for individual recipients within a list."""
    serializer_class = RecipientCreateSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Recipient.objects.filter(
            recipient_list__company=self.request.user.company
        )

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return RecipientSerializer
        return RecipientCreateSerializer


class NotificationSettingViewSet(ModelViewSet):
    """CRUD for notification settings (one per company)."""
    serializer_class = NotificationSettingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return NotificationSetting.objects.filter(company=self.request.user.company)

    def create(self, request, *args, **kwargs):
        existing = NotificationSetting.objects.filter(company=request.user.company).first()
        if existing:
            serializer = self.get_serializer(existing, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)
