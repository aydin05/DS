from core.api.permissions import CustomAccessPermission
from django.utils.translation import gettext_lazy as _


class DisplayTypePermission(CustomAccessPermission):
    message = _('You do not have permission to manage display types.')
    permission = 'displaytype'
    permission_model = 'display'


class DisplayGroupPermission(CustomAccessPermission):
    message = _('You do not have permission to manage display groups.')
    permission = 'displaygroup'
    permission_model = 'display'


class DisplayPermission(CustomAccessPermission):
    message = _('You do not have permission to manage displays.')
    permission = 'display'
    permission_model = 'display'