import os
import logging

from django.conf import settings
from django.db.models.signals import post_delete
from django.dispatch import receiver

from playlist.models import MergedVideo

logger = logging.getLogger(__name__)


@receiver(post_delete, sender=MergedVideo)
def cleanup_merged_video_file(sender, instance, **kwargs):
    """Remove the physical video file from disk when a MergedVideo record is deleted."""
    if instance.video_file:
        full_path = os.path.join(settings.MEDIA_ROOT, str(instance.video_file))
        try:
            if os.path.isfile(full_path):
                os.remove(full_path)
                logger.info("Deleted merged video file: %s", full_path)
        except OSError as e:
            logger.warning("Failed to delete merged video file %s: %s", full_path, e)
