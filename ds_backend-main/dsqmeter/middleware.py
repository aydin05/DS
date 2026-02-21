class ForceHttpsMiddleware:
    """
    Force request.scheme to 'https' in production when behind a reverse proxy.
    This ensures DRF FileField and build_absolute_uri() generate https:// URLs.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from django.conf import settings
        if settings.PROD:
            request.META['wsgi.url_scheme'] = 'https'
        return self.get_response(request)
