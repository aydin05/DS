from rest_framework import permissions, status, generics,views
from account.api.serializers import ForgetPasswordRequestSerializer, RedirectUrlParamsSerializer, RegistrationSerializer, LoginSerializer, ResetPasswordSerializer, UserSerializer,CountrySerializer,CompanySerializer,CompanyUserSerializer
from django.contrib.auth import get_user_model
from account.tools.token import get_tokens
from tools.custom_filter_tools import get_or_none
from rest_framework.response import Response
from knox.auth import TokenAuthentication
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.signals import user_logged_out
from django.contrib.auth import login as django_login
from datetime import datetime
from account.models import Company
from django_countries import countries
from django.utils.http import urlsafe_base64_decode
from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from django.conf import settings

User = get_user_model()


class RegistrationAPIView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegistrationSerializer
    model = User

    def post(self, request):
        email = request.data.get("email")
        if get_or_none(User, email=str(email).lower(), is_active=False):
            response_data = {
                "message": _("This user is not active. Please activate your account"),
                "action": "registration",
                "error": "not_activated"
            }
            return Response(data=response_data, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response_data = {"action": "registration", "message": _("Registration was completed")}
        return Response(data=response_data, status=status.HTTP_201_CREATED)






class LoginAPIView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    login_serializer_class = LoginSerializer

    def process_login(self, user):
        django_login(self.request, user)

    def login(self, user):
        self.process_login(user)
        return UserSerializer(user, context={'request': self.request}).data


    def post(self, request):
        login_serializer = self.login_serializer_class(data=request.data)
        login_serializer.is_valid(raise_exception=True)
        user = login_serializer.user
        user.last_login = datetime.now()
        user.save()
        response_data = self.login(user)
        return Response(data=response_data, status=status.HTTP_200_OK)


class LogoutView(views.APIView):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, format=None):
        request._auth.delete()
        user_logged_out.send(sender=request.user.__class__,
                             request=request, user=request.user)
        return Response(None, status=status.HTTP_204_NO_CONTENT)




class LogoutAllView(views.APIView):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, format=None):
        request.user.auth_token_set.all().delete()
        user_logged_out.send(sender=request.user.__class__,
                             request=request, user=request.user)
        return Response(None, status=status.HTTP_204_NO_CONTENT)



class CountryView(views.APIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = CountrySerializer

    def get(self, request, format=None):
        return Response(countries)




class ForgetPasswordRequestAPIView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny, )
    serializer_class = ForgetPasswordRequestSerializer
    params_serializer_class = RedirectUrlParamsSerializer
    response_action = 'forget_password'
    

    def post(self, request):
        params_serializer = self.params_serializer_class(data=request.GET)
        params_serializer.is_valid(raise_exception=True)
        redirect_url = params_serializer.data.get('redirect_url')
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_or_none(User, email=serializer.data['email'])
        mail_subject = _('Reset your password')
        template = 'email/password_reset_email_api.html'
        tokens = get_tokens(user)
        message = render_to_string(template, {
            'user': user,
            'redirect_url': f"{redirect_url}?uidb64={tokens['uid']}&token={tokens['token']}"
        })

        email = EmailMessage(
            mail_subject, message, to=[user.email]
        )
        email.content_subtype = 'html'
        email.send()
        message = _("Reset password link have already sent to your email. Please check your email")
        response_data = {
            "message": message,
            "action": self.response_action
        }
        return Response(data=response_data, status=status.HTTP_200_OK)



class ResetPasswordAPIView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = ResetPasswordSerializer
    model = User
    response_action = 'reset_password'
    
    @staticmethod
    def get_user(uidb64):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None
        return user

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        uid = serializer.data['uidb64']
        token = serializer.data['token']
        self.user = self.get_user(uid)
        if self.user:
            password = serializer.data.get('password')
            if password is not None:
                self.user.set_password(password)
                self.user.save()
            self.message = _('Your password changed, Please log in')
        else:
            self.message = _('User not found')

        response_data = {"action": self.response_action, "message": self.message}
        return Response(data=response_data, status=status.HTTP_200_OK)
