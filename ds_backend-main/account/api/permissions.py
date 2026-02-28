from core.api.permissions import CustomAccessPermission
from django.utils.translation import gettext_lazy as _


class CompanyUserPermission(CustomAccessPermission):
    message = _('You do not have permission to manage users.')
    permission = 'user'
    permission_model = 'account'


class RoleGroupPermission(CustomAccessPermission):
    message = _('You do not have permission to manage roles.')
    permission = 'rolegroup'
    permission_model = 'account'
