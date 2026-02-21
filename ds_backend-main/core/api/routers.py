from rest_framework.routers import DefaultRouter
from core.api.viewsets import *


router = DefaultRouter()

router.register(r'user', CompanyUserViewSet,basename='AddUser')
router.register(r'file', CompanyFileViewSet,basename='CompanyFile')
router.register(r'logs', DeviceLogViewSet, basename='DeviceLogs')