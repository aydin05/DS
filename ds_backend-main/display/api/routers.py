from rest_framework.routers import DefaultRouter
from display.api.viewsets import DisplayTypeViewSet,DisplayGroupViewSet,DisplayViewSet


router = DefaultRouter()

router.register(r'display-type', DisplayTypeViewSet,basename='display-type')
router.register(r'display-group', DisplayGroupViewSet,basename='display-group')
router.register(r'display', DisplayViewSet,basename='display')