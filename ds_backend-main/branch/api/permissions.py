from core.api.permissions import CustomAccessPermission
from django.utils.translation import gettext_lazy as _


class BranchPermission(CustomAccessPermission):
    message = _('You do not have permission to manage branches.')
    permission = 'branch'
    permission_model = 'branch'


