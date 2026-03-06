from django.apps import AppConfig


class PlaylistConfig(AppConfig):
    name = 'playlist'

    def ready(self):
        import playlist.signals  # noqa: F401
