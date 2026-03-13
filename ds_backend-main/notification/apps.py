import os

from django.apps import AppConfig


class NotificationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notification'

    def ready(self):
        # Device status checker is run via supervisord (check_device_status
        # management command).  Only start the in-process background thread
        # when developing locally (manage.py runserver) so the checker still
        # works without supervisord.
        run_main = os.environ.get('RUN_MAIN')
        if run_main == 'true':
            from notification.background import start_device_status_checker
            start_device_status_checker()
