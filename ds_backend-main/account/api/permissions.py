from core.api.permissions import CustomAccessPermission
from django.utils.translation import gettext_lazy as _


class CompanyUserPermission(CustomAccessPermission):
    message = _('No action is allowed on the user.')
    permission = 'user'
    permission_model = 'account'


class RoleGroupPermission(CustomAccessPermission):
    message = _('No action is allowed on the user.')
    permission = 'rolegroup'
    permission_model = 'account'
