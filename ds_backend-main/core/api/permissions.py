from rest_framework import permissions
from rest_framework.response import Response
from django.utils.translation import gettext_lazy as _
from django.apps import apps
from django.contrib.auth.models import Permission



class CustomAccessPermission(permissions.BasePermission):
    message = _('Adding customers not allowed.')
    permission = ''
    permission_keyword = ['delete_', 'add_', 'change_', 'view_']
    permission_model = ''

    def has_permission(self, request, view):
        if request.user.is_master or request.user.is_admin:
            return True
        try:
            has_company = request.user.company
        except Exception:
            return False
        if request.method == "GET":
            view_perm = f'{self.permission_model}.view_{self.permission_model}'
            return has_company and request.user.has_perm(view_perm)
        permission_list = [self.permission_model + "." + item + self.permission for item in self.permission_keyword]
        return has_company and request.user.has_perms(permission_list)



class CompanyFilePermission(CustomAccessPermission):
    message = _('No action is allowed on the user.')
    permission = 'companyfile'
    permission_model = 'companyfile'
