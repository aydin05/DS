from django.urls import path
from display.api.routers import router
from display.api.viewsets import UnAssignedDisplayApiView,DisplayDetailApiView


urlpatterns = [
    path('unassigned-display/', UnAssignedDisplayApiView.as_view(), name='unassigned-display'),
    path('display-detail/',DisplayDetailApiView.as_view(),name="display-detail")
]
 
urlpatterns += router.urls