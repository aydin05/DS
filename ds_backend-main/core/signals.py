from moviepy.video.io.VideoFileClip import VideoFileClip
from django.db.models.signals import post_save
from django.dispatch import receiver
from core.models import CompanyFile
import mimetypes


@receiver(post_save, sender=CompanyFile)
def generate_video_duration(sender, instance, created, **kwargs):
    if not instance.duration:
        file_path = instance.file.path
        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type and mime_type.startswith("video"):
            try:
                clip = VideoFileClip(file_path)
                instance.duration = clip.duration
                instance.save()
            except Exception as e:
                # Burada logging istifadə edə bilərsən
                print(f"Failed to process video file: {file_path}. Error: {e}")
        else:
            instance.duration = 10
            instance.save()
