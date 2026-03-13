from django.contrib.auth.backends import ModelBackend


class RoleGroupBackend(ModelBackend):
    """
    Custom authentication backend that resolves permissions through the
    User.role → RoleGroup.role → Group.permissions chain.

    Django's default ModelBackend only checks user.groups (the built-in
    PermissionsMixin M2M).  This project stores group assignments in a
    custom path:  User.role (M2M → RoleGroup) → RoleGroup.role (M2M → Group).
    """

    def _get_group_permissions(self, user_obj):
        # Traverse: user.role (RoleGroup) → role.role (Group) → permissions
        from django.contrib.auth.models import Permission
        return Permission.objects.filter(
            group__rolegroup__user=user_obj,
        )

    def get_all_permissions(self, user_obj, obj=None):
        if not user_obj.is_active:
            return set()
        if not hasattr(user_obj, '_rolegroup_perm_cache'):
            perms = self._get_group_permissions(user_obj)
            user_obj._rolegroup_perm_cache = {
                f'{p.content_type.app_label}.{p.codename}' for p in perms
            }
        return user_obj._rolegroup_perm_cache

    def has_perm(self, user_obj, perm, obj=None):
        if not user_obj.is_active:
            return False
        return perm in self.get_all_permissions(user_obj, obj)
