from branch.api.search import CustomSearchFilter
from branch.api.serializer import BranchSerializer
from branch.models import *
from rest_framework import permissions, pagination
from branch.api.permissions import BranchPermission
from core.api.viewsets import MultiSerializerViewSet 
from rest_framework import filters


class BranchViewSet(MultiSerializerViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    multi_permissions = {
        'default': (permissions.IsAuthenticated, BranchPermission,)
    }
    multi_serializers = {
        'default': BranchSerializer,
    }
    model = Branch
    filter_backends = [CustomSearchFilter]
    ordering= ['id']

    def get_queryset(self):
        queryset = super().get_queryset().order_by('-created_at')
        queryset = queryset.filter(company=self.request.user.company)
        notif = self.request.query_params.get('notifications_enabled')
        if notif is not None:
            queryset = queryset.filter(notifications_enabled=notif.lower() in ('true', '1'))
        return queryset
