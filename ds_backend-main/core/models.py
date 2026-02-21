from django.db import models
from django.db.models import JSONField
from django.utils.translation import gettext_lazy as _
from dsqmeter.utils.base_model import BaseModel


class WidgetType(BaseModel):
    name = models.CharField(_("Name"),max_length=100)
    label = models.CharField(_("Label"),max_length=155)
    company = models.ForeignKey('account.Company', on_delete=models.CASCADE)
    attr = JSONField(_('Attr'),default=dict)


class CompanyFile(BaseModel):
    file = models.FileField(_("File"),upload_to='company_file')
    company = models.ForeignKey('account.Company', on_delete=models.CASCADE)
    type = models.CharField(_("Type"),max_length=100,null=True,blank=True)
    duration = models.PositiveIntegerField(_("Duration"),null=True,blank=True)


class CompanySettings(BaseModel):
    """Per-company configurable settings."""
    THRESHOLD_CHOICES = [
        (30, '30 seconds'),
        (60, '1 minute'),
        (90, '1 minute 30 seconds'),
        (120, '2 minutes'),
        (150, '2 minutes 30 seconds'),
        (180, '3 minutes'),
        (210, '3 minutes 30 seconds'),
        (240, '4 minutes'),
        (270, '4 minutes 30 seconds'),
        (300, '5 minutes'),
    ]
    company = models.OneToOneField(
        'account.Company', on_delete=models.CASCADE, related_name='settings'
    )
    heartbeat_threshold_seconds = models.PositiveIntegerField(
        _("Heartbeat Threshold (seconds)"), default=120,
        choices=THRESHOLD_CHOICES,
        help_text=_("How long without a heartbeat before a device is marked inactive")
    )

    class Meta:
        verbose_name = _("Company Settings")
        verbose_name_plural = _("Company Settings")

    def __str__(self):
        return f"{self.company.name} settings"


class DeviceLog(BaseModel):
    company = models.ForeignKey('account.Company', on_delete=models.CASCADE)
    device = models.ForeignKey('display.Display', on_delete=models.CASCADE)
    message = models.TextField(blank=True)
    level = models.CharField(max_length=100, null=True, blank=True)
    extra_data = JSONField(_('Extra Data'),default=dict)
