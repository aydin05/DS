from django.urls import path
from account.api.views import ForgetPasswordRequestAPIView, RegistrationAPIView,LoginAPIView,CountryView, LogoutView,LogoutAllView, ResetPasswordAPIView
from account.api.routers import router


urlpatterns = [
	path('register/', RegistrationAPIView.as_view(), name='register'),
	path('login/', LoginAPIView.as_view(), name='login'),
	path('countries/',CountryView.as_view(),name='countries'),
	path('logout/', LogoutView.as_view(), name='logout'),
	path('logout-all/', LogoutAllView.as_view(), name='logout-all'),
	path('forget-password/', ForgetPasswordRequestAPIView.as_view(), name='forget_password'),
	path('reset-password/', ResetPasswordAPIView.as_view(), name='reset_password'),
]

urlpatterns += router.urls
