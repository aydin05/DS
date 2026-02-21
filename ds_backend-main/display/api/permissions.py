from core.api.permissions import CustomAccessPermission
from django.utils.translation import gettext_lazy as _


class DisplayTpyePermission(CustomAccessPermission):
    message = _('No action is allowed on the user.')
    permission = 'displaytype'
    permission_model = 'display'


class DisplayGroupPermission(CustomAccessPermission):
    message = _('No action is allowed on the user.')
    permission = 'displaygroup'
    permission_model = 'display'


class DisplayPermission(CustomAccessPermission):
    message = _('No action is allowed on the user.')
    permission = 'display'
    permission_model = 'display'