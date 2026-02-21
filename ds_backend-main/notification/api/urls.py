from django.urls import path, include
from rest_framework.routers import DefaultRouter
from notification.api.viewsets import (
    EmailConfigViewSet, EmailTemplateViewSet,
    RecipientListViewSet, RecipientViewSet,
    NotificationSettingViewSet
)

router = DefaultRouter()
router.register('email-config', EmailConfigViewSet, basename='email-config')
router.register('email-templates', EmailTemplateViewSet, basename='email-templates')
router.register('recipient-lists', RecipientListViewSet, basename='recipient-lists')
router.register('recipients', RecipientViewSet, basename='recipients')
router.register('notification-settings', NotificationSettingViewSet, basename='notification-settings')

urlpatterns = router.urls
