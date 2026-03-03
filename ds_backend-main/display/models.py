from django.db import models
from dsqmeter.utils.base_model import BaseModel
from django.utils.translation import gettext_lazy as _


class DisplayType(BaseModel):
    name = models.CharField(_("Name"), max_length=100)
    description = models.TextField(_("Description"), null=True, blank=True)
    width = models.PositiveIntegerField(_("Width"), default=0)
    height = models.PositiveIntegerField(_("Height"), default=0)
    is_standart = models.BooleanField(_("Is standart"), default=False)
    company = models.ForeignKey('account.Company', on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class DisplayGroup(BaseModel):
    name = models.CharField(_("Name"), max_length=100)
    description = models.TextField(_("Description"), null=True, blank=True)
    playlist = models.ForeignKey('playlist.Playlist', on_delete=models.CASCADE, null=True,blank=True)
    schedule = models.ForeignKey(("playlist.Schedule"), on_delete=models.CASCADE, null=True,blank=True)
    company = models.ForeignKey('account.Company', on_delete=models.CASCADE, null=True,blank=True)

    def __str__(self) -> str:
        return self.name


class Display(BaseModel):
    HEARTBEAT_SOURCE_CHOICES = [
        ('tizen', 'Tizen App'),
        ('openlink', 'Open Link (Browser)'),
        ('tv-player', 'TV Player (Vanilla)'),
        ('unknown', 'Unknown'),
    ]

    name = models.CharField(_("Name"), max_length=100)
    description = models.TextField(_("Description"), null=True, blank=True)
    display_type = models.ForeignKey(DisplayType, on_delete=models.CASCADE)
    username = models.CharField(_("Username"), max_length=100, db_index=True)
    password = models.CharField(_("Password"), max_length=100)
    playlist = models.ForeignKey('playlist.Playlist', on_delete=models.CASCADE,null=True,blank=True)
    schedule = models.ForeignKey("playlist.Schedule", on_delete=models.CASCADE, null=True, blank=True)
    branch = models.ForeignKey('branch.Branch', on_delete=models.CASCADE)
    company = models.ForeignKey('account.Company', on_delete=models.CASCADE)
    display_group = models.ForeignKey(DisplayGroup,on_delete=models.SET_NULL, null=True,blank=True)
    last_heartbeat = models.DateTimeField(_("Last Heartbeat"), null=True, blank=True, db_index=True)
    last_heartbeat_source = models.CharField(
        _("Heartbeat Source"), max_length=20,
        choices=HEARTBEAT_SOURCE_CHOICES, default='unknown',
    )
    notifications_enabled = models.BooleanField(_('Notifications Enabled'), default=True)
    last_notified_inactive_at = models.DateTimeField(_('Last Notified Inactive'), null=True, blank=True)
    was_notified_inactive = models.BooleanField(_('Was Notified Inactive'), default=False)

    def __str__(self):
        return self.name
