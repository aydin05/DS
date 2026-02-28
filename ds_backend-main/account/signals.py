from django.db.models.signals import post_save
from django.dispatch import receiver
from core.models import WidgetType
from account.models import Company
from core.utils import widget_types


@receiver(post_save, sender=Company)
def create_widget_type(sender, instance, created, **kwargs):
    if created:
        for widget_type in widget_types:
            WidgetType.objects.get_or_create(name=widget_type.get("name"), label=widget_type.get("label"), company=instance, attr=widget_type.get("attr"))
    else:
        pass

