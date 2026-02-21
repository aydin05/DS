from rest_framework.routers import DefaultRouter
from branch.api.viewsets import *


router = DefaultRouter()

router.register(r'branch', BranchViewSet,basename='Branch')

