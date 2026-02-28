from rest_framework.routers import DefaultRouter
from account.api.viewsets import RoleGroupViewSet
from core.api.viewsets import CompanyUserViewSet


router = DefaultRouter()

router.register(r'user', CompanyUserViewSet,basename='AddUser')
router.register(r'role', RoleGroupViewSet,basename='RoleGroup')
