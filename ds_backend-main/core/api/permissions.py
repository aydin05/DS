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

    @staticmethod
    def get_view_perm(model, user, models_list):
        for item in models_list:
            if item == model:
                codename = f'view_{item}'
                permission = Permission.objects.get(codename=codename)
                user.user_permissions.add(permission)
                return item + '.' + codename
        return None

    def has_permission(self, request, view):
        if request.user.is_master or request.user.is_admin:
            return True
        try:
            has_company = request.user.company
        except:
            return False
        permission_list = [self.permission_model + "." + item + self.permission for item in self.permission_keyword]
        models_list = []
        for item in apps.get_models():
            models_list.append(item.__name__.lower())
        if request.method == "GET":
            perm = self.get_view_perm(self.permission_model, request.user, models_list)
            if perm:
                return has_company and request.user.has_perm(perm)
        return has_company and request.user.has_perms(permission_list)



class CompanyFilePermission(CustomAccessPermission):
    message = _('No action is allowed on the user.')
    permission = 'companyfile'
    permission_model = 'companyfile'
