from core.api.permissions import CustomAccessPermission
from django.utils.translation import gettext_lazy as _


class BranchPermission(CustomAccessPermission):
    message = _('No action is allowed on the user.')
    permission = 'branch'
    permission_model = 'branch'


