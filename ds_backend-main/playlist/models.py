from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import WidgetType
from dsqmeter.utils.base_model import BaseModel
from django.db.models import JSONField
from utils.choices import REPEAT_LIST
from display.models import DisplayType

class Playlist(BaseModel):
    name = models.CharField(_("Name"), max_length=100)
    description = models.TextField(_("Description"), null=True, blank=True)
    company = models.ForeignKey('account.Company', on_delete=models.CASCADE)
    default_display_type = models.ForeignKey('display.DisplayType', on_delete=models.PROTECT)
    extra_fields = JSONField(default=list, blank=True) 

    def __str__(self):
        return self.name


class Schedule(BaseModel):
    name = models.CharField(_("Name"), max_length=100)
    description = models.TextField(_("Description"), null=True, blank=True)
    company = models.ForeignKey('account.Company', on_delete=models.CASCADE)
    default_playlist = models.ForeignKey(Playlist, on_delete=models.SET_NULL, null=True, blank=True)
    branches = models.ManyToManyField('branch.Branch', blank=True, related_name='schedules')
    display_type = models.ForeignKey('display.DisplayType', on_delete=models.SET_NULL, null=True, blank=True, related_name='schedules')

    def __str__(self):
        return self.name


class SchedulePlaylist(BaseModel):
    name = models.CharField(_("Name"), max_length=100)
    description = models.TextField(_("Description"), null=True, blank=True)
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE)
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE)
    start_time = models.DateTimeField(_("Start time"),null=True, blank=True)
    end_time = models.DateTimeField(_("End time"),null=True, blank=True)
    repeat = models.BooleanField(_("Repeat"), default=False)
    repeat_type = models.CharField(_("Repeat Type"), choices=REPEAT_LIST, null=True,blank=True,max_length=100)
    is_all_day = models.BooleanField(_("Is all day"), default=False)

    def __str__(self):
        return self.name


class Slide(BaseModel):
    name = models.CharField(_("Name"), max_length=100)
    position = models.PositiveIntegerField(_("Position"), default=0)
    duration = models.PositiveIntegerField(_("Duration"), default=0)
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE)
    company = models.ForeignKey('account.Company', on_delete=models.CASCADE)
    bg_color = models.CharField(_("Background color"), max_length=100)

    def __str__(self):
        return self.name


class SlideItem(BaseModel):
    type = models.ForeignKey(WidgetType, on_delete=models.CASCADE, related_name='widget_type')
    slide = models.ForeignKey(Slide, on_delete=models.CASCADE)
    top = models.PositiveIntegerField(_("Top"), default=0)
    left = models.PositiveIntegerField(_("Left"), default=0)
    width = models.PositiveIntegerField(_("Width"), default=0)
    height = models.PositiveIntegerField(_("Height"), default=0)
    index = models.PositiveIntegerField(_("Index"), default=0)
    attr = JSONField(_("Attr"), default=dict)

    def __str__(self):
        return self.type.name


class MergedVideo(BaseModel):
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name='merged_videos')
    display_type = models.ForeignKey('display.DisplayType', on_delete=models.CASCADE)
    content_hash = models.CharField(_("Content Hash"), max_length=64, db_index=True)
    video_file = models.CharField(_("Video File Path"), max_length=500)
    status = models.CharField(
        _("Status"), max_length=20, default='pending',
        choices=[('pending', 'Pending'), ('processing', 'Processing'),
                 ('ready', 'Ready'), ('failed', 'Failed')]
    )
    error_message = models.TextField(_("Error"), null=True, blank=True)
    retry_count = models.PositiveIntegerField(_("Retry Count"), default=0)

    class Meta:
        unique_together = ('playlist', 'display_type', 'content_hash')

    def __str__(self):
        return f"MergedVideo playlist={self.playlist_id} hash={self.content_hash}"


class SlideItemDisplayType(BaseModel):
    slide_item = models.ForeignKey(SlideItem, on_delete=models.CASCADE, null=True,blank=True)
    display_type = models.ForeignKey(DisplayType, on_delete=models.CASCADE, null=True,blank=True)
    top = models.PositiveIntegerField(_("Top"), default=0)
    left = models.PositiveIntegerField(_("Left"), default=0)
    width = models.PositiveIntegerField(_("Width"), default=0)
    height = models.PositiveIntegerField(_("Height"), default=0)