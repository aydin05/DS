from rest_framework.routers import DefaultRouter
from core.api.viewsets import CompanyFileViewSet, DeviceLogViewSet


router = DefaultRouter()

router.register(r'file', CompanyFileViewSet,basename='CompanyFile')
router.register(r'logs', DeviceLogViewSet, basename='DeviceLogs')