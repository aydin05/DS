import os

from django.apps import AppConfig


class NotificationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notification'

    def ready(self):
        # In Django dev server, RUN_MAIN is 'true' only in the reloader child.
        # In production (uWSGI/gunicorn), RUN_MAIN is not set at all.
        # Use NOTIFICATION_CHECKER_DISABLED env var to prevent checker in
        # extra workers — set it on all workers except one, or run the
        # checker via a management command instead.
        run_main = os.environ.get('RUN_MAIN')
        if run_main == 'true' or (run_main is None and not os.environ.get('NOTIFICATION_CHECKER_DISABLED')):
            from notification.background import start_device_status_checker
            start_device_status_checker()
