from django.core.management.base import BaseCommand
from core.models import WidgetType
from account.models import Company
from core.utils import widget_types


class Command(BaseCommand):

    def handle(self, *args, **options):
        companies = Company.objects.all()
        for company in companies:
            for widget_type in widget_types:
                WidgetType.objects.get_or_create(name=widget_type.get("name"), label=widget_type.get("label"),
                                                 company=company, attr=widget_type.get("attr"))
        # for role in widget_types:
        #     name = role.get('name')
        #     code = role.get('code_keyword')
        #     group, _ = Group.objects.get_or_create(name=name)
        #     GroupCustom.objects.get_or_create(group=group, code=code)
        #     permissions = role.get('permissions')
        #     for permission in permissions:
        #         app_label, model = permission.split(".")
        #         my_model = apps.get_model(app_label, model)
        #         permission_obj = Permission.objects.filter(content_type=(ContentType.objects.get_for_model(my_model)))
        #         for per in permission_obj:
        #             group.permissions.add(per)
        print('Migration completed successfully')
        print("Migration statistics")
        print('-------------------')


select = {'renamed_value': 'cryptic_value_name'}
