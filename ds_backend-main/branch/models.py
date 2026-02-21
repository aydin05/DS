from django.db import models

# Create your models here.
from django.db import models
from dsqmeter.utils.base_model import BaseModel
from django.utils.translation import gettext_lazy as _
from utils.choices import TIMEZONE_LIST

# Create your models here.




class Branch(BaseModel):

    name = models.CharField(_("Name"), max_length=100)
    description = models.TextField(_("Description"), null=True, blank=True)
    timezone = models.CharField(_("Timezone"), choices=TIMEZONE_LIST, default="Asia/Dubai",max_length=100)
    company = models.ForeignKey('account.Company', on_delete=models.CASCADE)
    notifications_enabled = models.BooleanField(_("Notifications Enabled"), default=True)

    def __str__(self):
        return self.name