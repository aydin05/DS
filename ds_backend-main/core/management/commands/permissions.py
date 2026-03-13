
from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand
from django.apps import apps
from account.models import GroupCustom


class Command(BaseCommand):

    def add_arguments(self, parser):
        parser.add_argument('delete_all', nargs='?', default=False, type=bool)

    def handle(self, *args, **options):
        delete_all = options.get('delete_all', False)
        if delete_all:
            group_obj = Group.objects.all()
            group_obj.delete()
            print('Deleted all group.............')
        print('Creating started .............')
        roles = [
            {"name": "User management", "permissions": ['account.User', 'account.RoleGroup'], "code_keyword": "user_management"},
            {"name": "Branch", "permissions": ['branch.Branch', 'display.Display'], "code_keyword": "branch_management"},
            {"name": "Playlist", "permissions": ['playlist.Playlist'], "code_keyword": "playlist_management"},
            {"name": "Display Groups","permissions": ['display.DisplayGroup'], "code_keyword": "display_group_management"},
            {"name": "Display Types","permissions": ['display.DisplayType'], "code_keyword": "display_types_management"},
            {"name": "Schedules","permissions": ['playlist.Schedule'], "code_keyword": "schedule_management"},
            {"name": "Device Status","permissions": ['core.DeviceLog'], "code_keyword": "device_status_management"},
            {"name": "Settings","permissions": ['notification.EmailConfig', 'notification.EmailTemplate', 'notification.RecipientList', 'notification.Recipient', 'notification.NotificationSetting'], "code_keyword": "settings_management"},
        ]
        for role in roles:
            name = role.get('name')
            code = role.get('code_keyword')
            group, _ = Group.objects.get_or_create(name=name)
            GroupCustom.objects.update_or_create(group=group, defaults={'code': code})
            permissions = role.get('permissions')
            for permission in permissions:
                app_label, model = permission.split(".")
                my_model = apps.get_model(app_label, model)
                permission_obj = Permission.objects.filter(content_type=(ContentType.objects.get_for_model(my_model)))
                for per in permission_obj:
                    group.permissions.add(per)
        print('Migration completed successfully')
        print("Migration statistics")
        print('-------------------')