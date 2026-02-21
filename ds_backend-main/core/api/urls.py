from django.urls import path
from .routers import router
from .viewsets import GroupApiView, WidgetTypeApiView, LogReceiverAPIView, HeartbeatAPIView, CompanySettingsAPIView

urlpatterns = [
    path('groups/', GroupApiView.as_view(), name='groups'),
    path('widgettypes/', WidgetTypeApiView.as_view(), name='widgettypes'),
    path('device-logs/', LogReceiverAPIView.as_view(), name='receive_log_api_view'),
    path('heartbeat/', HeartbeatAPIView.as_view(), name='heartbeat'),
    path('company-settings/', CompanySettingsAPIView.as_view(), name='company-settings'),
]

urlpatterns += router.urls