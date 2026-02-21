from rest_framework import filters
from rest_framework import viewsets
from account.models import RoleGroup
from account.api.serializers import RoleGroupSerializer
from rest_framework import permissions, status, generics,views
from core.api.viewsets import MultiSerializerViewSet
from account.api.permissions import RoleGroupPermission


class RoleGroupViewSet(MultiSerializerViewSet):
    queryset = RoleGroup.objects.all()
    multi_permissions = {
        'default': (permissions.IsAuthenticated, RoleGroupPermission,)
    }
    multi_serializers = {
        'default': RoleGroupSerializer,
    }
    model = RoleGroup
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
