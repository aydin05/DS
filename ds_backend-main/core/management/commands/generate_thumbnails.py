"""
Management command to generate thumbnails for existing CompanyFile records
that don't have them yet. Run once after deploying the thumbnail feature.

Usage: python manage.py generate_thumbnails
"""
import mimetypes
from django.core.management.base import BaseCommand
from core.models import CompanyFile
from core.signals import _generate_image_thumbnail, _generate_video_thumbnail
from django.core.files.base import ContentFile
import os


class Command(BaseCommand):
    help = 'Generate thumbnails for existing CompanyFile records without thumbnails'

    def handle(self, *args, **options):
        files = CompanyFile.objects.filter(thumbnail='').exclude(file='')
        total = files.count()
        self.stdout.write(f'Found {total} files without thumbnails')

        success = 0
        failed = 0
        for cf in files.iterator():
            try:
                file_path = cf.file.path
                if not os.path.exists(file_path):
                    self.stdout.write(self.style.WARNING(f'  Skip {cf.id}: file not found at {file_path}'))
                    failed += 1
                    continue

                mime_type, _ = mimetypes.guess_type(file_path)
                thumb_bytes = None

                if mime_type and mime_type.startswith('image'):
                    thumb_bytes = _generate_image_thumbnail(file_path)
                elif mime_type and mime_type.startswith('video'):
                    thumb_bytes = _generate_video_thumbnail(file_path)

                if thumb_bytes:
                    thumb_name = f'thumb_{os.path.basename(file_path)}.jpg'
                    cf.thumbnail.save(thumb_name, ContentFile(thumb_bytes), save=False)
                    CompanyFile.objects.filter(pk=cf.pk).update(thumbnail=cf.thumbnail)
                    success += 1
                    self.stdout.write(f'  OK {cf.id}: {os.path.basename(file_path)}')
                else:
                    failed += 1
                    self.stdout.write(self.style.WARNING(f'  Skip {cf.id}: could not generate thumbnail'))
            except Exception as e:
                failed += 1
                self.stdout.write(self.style.ERROR(f'  Error {cf.id}: {e}'))

        self.stdout.write(self.style.SUCCESS(
            f'Done. {success} thumbnails generated, {failed} skipped/failed.'
        ))
