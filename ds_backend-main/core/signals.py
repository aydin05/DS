import subprocess
import json
import mimetypes
from django.db.models.signals import post_save
from django.dispatch import receiver
from core.models import CompanyFile


@receiver(post_save, sender=CompanyFile)
def generate_video_duration(sender, instance, created, **kwargs):
    if not instance.duration:
        file_path = instance.file.path
        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type and mime_type.startswith("video"):
            try:
                result = subprocess.run(
                    [
                        'ffprobe', '-v', 'quiet',
                        '-print_format', 'json',
                        '-show_format',
                        file_path,
                    ],
                    capture_output=True, text=True, timeout=30,
                )
                if result.returncode == 0:
                    probe = json.loads(result.stdout)
                    duration = float(probe.get('format', {}).get('duration', 10))
                    instance.duration = int(duration)
                else:
                    instance.duration = 10
                instance.save()
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Failed to get video duration: {file_path}. Error: {e}")
        else:
            instance.duration = 10
            instance.save()
