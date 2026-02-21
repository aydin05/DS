from django.urls import path
from playlist.api.routers import router
from playlist.api.viewsets import SlideApiView, PlaylistDetailApiView, PublishApiView, TabloTicketApiView


urlpatterns = [
    path('<int:id>/slide/', SlideApiView.as_view(), name='slide'),
    path('', PlaylistDetailApiView.as_view(), name='playlist-detail'),
    path('ticket/', TabloTicketApiView.as_view(), name='tablo-ticket-detail'),
    path('publish/<str:method>/<int:id>/', PublishApiView.as_view(), name='publish'),
]
 
urlpatterns += router.urls