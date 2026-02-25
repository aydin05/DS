import io
import logging
import subprocess
import json
import mimetypes
import os

from django.core.files.base import ContentFile
from django.db.models.signals import post_save
from django.dispatch import receiver
from PIL import Image as PILImage

from core.models import CompanyFile

logger = logging.getLogger(__name__)

THUMB_SIZE = (200, 200)


def _generate_image_thumbnail(file_path):
    """Generate a JPEG thumbnail from an image file. Returns bytes or None."""
    try:
        img = PILImage.open(file_path)
        img.thumbnail(THUMB_SIZE, PILImage.LANCZOS)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=80)
        return buf.getvalue()
    except Exception as e:
        logger.warning("Failed to generate image thumbnail for %s: %s", file_path, e)
        return None


def _generate_video_thumbnail(file_path):
    """Extract a poster frame from a video using ffmpeg. Returns bytes or None."""
    tmp_out = f'/tmp/_thumb_{os.getpid()}.jpg'
    try:
        cmd = [
            'ffmpeg', '-y', '-i', file_path,
            '-ss', '0.5', '-frames:v', '1',
            '-vf', f'scale={THUMB_SIZE[0]}:-1',
            '-q:v', '5',
            tmp_out,
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if proc.returncode == 0 and os.path.exists(tmp_out):
            with open(tmp_out, 'rb') as f:
                return f.read()
        return None
    except Exception as e:
        logger.warning("Failed to generate video thumbnail for %s: %s", file_path, e)
        return None
    finally:
        if os.path.exists(tmp_out):
            os.remove(tmp_out)


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
                    dur = int(duration) or 10
                else:
                    dur = 10
                CompanyFile.objects.filter(pk=instance.pk).update(duration=dur)
            except Exception as e:
                logger.warning(f"Failed to get video duration: {file_path}. Error: {e}")
        else:
            CompanyFile.objects.filter(pk=instance.pk).update(duration=10)


@receiver(post_save, sender=CompanyFile)
def generate_thumbnail(sender, instance, created, **kwargs):
    if instance.thumbnail:
        return

    file_path = instance.file.path
    mime_type, _ = mimetypes.guess_type(file_path)

    thumb_bytes = None
    if mime_type and mime_type.startswith("image"):
        thumb_bytes = _generate_image_thumbnail(file_path)
    elif mime_type and mime_type.startswith("video"):
        thumb_bytes = _generate_video_thumbnail(file_path)

    if thumb_bytes:
        thumb_name = f"thumb_{os.path.basename(file_path)}.jpg"
        instance.thumbnail.save(thumb_name, ContentFile(thumb_bytes), save=False)
        CompanyFile.objects.filter(pk=instance.pk).update(thumbnail=instance.thumbnail)
