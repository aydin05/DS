from rest_framework import permissions
from rest_framework.response import Response
from django.utils.translation import gettext_lazy as _
from django.apps import apps
from django.contrib.auth.models import Permission



class CustomAccessPermission(permissions.BasePermission):
    message = _('Adding customers not allowed.')
    permission = ''
    permission_model = ''

    METHOD_PERMISSION_MAP = {
        'GET': 'view_',
        'HEAD': 'view_',
        'OPTIONS': 'view_',
        'POST': 'add_',
        'PUT': 'change_',
        'PATCH': 'change_',
        'DELETE': 'delete_',
    }

    def has_permission(self, request, view):
        if request.user.is_master or request.user.is_admin:
            return True
        try:
            has_company = request.user.company
        except Exception:
            return False
        keyword = self.METHOD_PERMISSION_MAP.get(request.method)
        if not keyword:
            return False
        perm = f'{self.permission_model}.{keyword}{self.permission}'
        return has_company and request.user.has_perm(perm)



class CompanyFilePermission(CustomAccessPermission):
    message = _('No action is allowed on the company file.')
    permission = 'companyfile'
    permission_model = 'core'
