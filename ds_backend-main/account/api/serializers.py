from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from knox.models import AuthToken as KnoxAuthToken
from .utils import default_create_token
from account.models import *
from branch.models import Branch
from django.contrib.auth.hashers import make_password
from utils.choices import TIMEZONE_LIST
from django.core import validators
from account.tools.validators import url_field_validator

User = get_user_model()

class UserSerializer(ModelSerializer):
    token = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'fullname', 'email', 'phone_number', 'job_title', 'company', 'timezone', 'branch', 'role', 'picture', 'is_admin', 'is_master', 'is_active','token')

    def get_token(self, object):
        request = self.context.get('request')
        if request and hasattr(request, 'META') and request.META.get('HTTP_AUTHORIZATION'):
            header_token = request.META.get('HTTP_AUTHORIZATION')
            return header_token.split()[1]
        return default_create_token(KnoxAuthToken,object)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        roles = []
        seen_codes = set()
        for role in instance.role.prefetch_related('role__groupcustom').all():
            for item in role.role.all():
                group_custom = getattr(item, 'groupcustom', None)
                if group_custom and group_custom.code not in seen_codes:
                    seen_codes.add(group_custom.code)
                    roles.append({
                        "code": group_custom.code,
                        "name": item.name
                    })
        data['role'] = roles
        return data


class CompanySerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Company
        fields = ('name', 'country')


class RegistrationSerializer(serializers.ModelSerializer):
    company = CompanySerializer()
    password = serializers.CharField(style={'input_type':'password'} , write_only= True)
    password_confirmation = serializers.CharField(style={'input_type':'password'} , write_only= True)
    
    class Meta:
        model = User
        fields = ('id', 'fullname', 'email', 'phone_number',"company",'password', 'password_confirmation')
        extra_kwargs = {
            'password': {
                'write_only': True,
                'validators': (validate_password,)
            },
             'password_confirmation': {
                'write_only': True,
                'validators': (validate_password,)
            }
        }

    def validate_email(self, value):
        return value.lower()

    # Hash password
    def validate_password(self, value):
        try:
            validate_password(password=value)
            return value
        except ValidationError as e:
            raise e

    def validate(self, data):
        password = data.get('password')
        if data.get('password_confirmation'):
            password_confirmation = data.pop('password_confirmation')
            if password != password_confirmation:
                raise serializers.ValidationError({'password': 'Passwords must match'})
        return data

    def create(self, validated_data):
        companies = validated_data.pop('company')
        password = validated_data.pop('password', None)
        created_company = Company.objects.create(**companies)
        user = self.Meta.model(**validated_data, company=created_company, is_master=True)
        if password is not None:
            user.set_password(password)
        user.save()
        return user
        
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            if attr == 'password':
                instance.set_password(value)
            else:
                setattr(instance, attr, value)
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    password = serializers.CharField(required=True, style={'input_type': 'password'}, max_length=50)
    email = serializers.CharField(required=True,style={'input_type': 'email'})

    def validate_email(self, value):
        return value.lower()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        user = authenticate(username=email, password=password)
        if not user:
            raise ValidationError(_('Invalid email or password'))
        self.user = user
        attrs['user'] = user
        return attrs


class CountrySerializer(serializers.Serializer):
    countries = CountryField()


class CompanyUserSerializer(RegistrationSerializer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop('company')
        # self.fields['timezone'].required = True
        if self.context['request'].user.is_authenticated:
            company = self.context['request'].user.company

            self.fields.update({
                'role': serializers.PrimaryKeyRelatedField(
                    queryset=RoleGroup.objects.filter(company=company), many=True,required=True),
                'branch': serializers.PrimaryKeyRelatedField(queryset=Branch.objects.filter(company=company), many=True,required=False),
                # 'day_of_week': serializers.ChoiceField(label=_('First day of week'), choices=WEEK_LIST,
                #                                              required=True),
                'fullname': serializers.CharField(label=_('Full name'), required=True),
                'email': serializers.EmailField(label=_('Email'), required=True),
                'phone_number': serializers.CharField(label=_('Phone number'), required=True),
                'password': serializers.CharField(label=_('Password'), required=True, style={'input_type': 'password'}),
                'is_admin': serializers.BooleanField(label=_('Is admin'), default=False, required=False),
                'is_master': serializers.BooleanField(label=_('Is master'), read_only=True),
                "job_title": serializers.CharField(label=_('Job title'), required=False),
                "timezone":serializers.ChoiceField(label=_('Timezone'), choices=TIMEZONE_LIST,required=False),
                "day_of_week":serializers.ChoiceField(label=_('First day of week'), choices=WEEK_LIST,required=False),
            })

    def validate_role_group(self, attr):
        is_admin = self.initial_data.get('is_admin')
        if not attr and not is_admin:
            raise ValidationError(_("Role group are required!"))
        return attr
        
    def validate_role(self, attr):
        is_admin = self.initial_data.get('is_admin')
        if not attr and not is_admin:
            raise ValidationError(_("Role is required!"))
        return attr

    def validate_branch(self, attr):
        is_admin = self.initial_data.get('is_admin')
        if not is_admin and not attr:
            raise ValidationError(_("Branch is required!"))
        return attr

    def validate_email(self, value):
        email = value.lower()
        qs = User.objects.filter(email=email)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise ValidationError(_("Email already exists!"))
        return email

    def create(self, validated_data):
        # validated_data.pop('password_confirmation')
        validated_data.update({'is_master': False})
        role_group = validated_data.pop('role', None)
        branch = validated_data.pop('branch', None)
        validated_data.update({'company': self.context['request'].user.company})
        user = User.objects.create_user(**validated_data)
        if role_group:
            for role in role_group:
                user.role.add(role)
        if branch:
            for branch_item in branch:
                user.branch.add(branch_item)
        return user

    def update(self, instance, validated_data):
        password = validated_data.get('password')
        if password:
            validated_data.update({'password': make_password(password)})
        if "role" in validated_data:
            instance.role.set(validated_data.pop('role'))
        if 'branch' in validated_data:
            instance.branch.set(validated_data.pop('branch'))
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('password'):
            data.pop('password')
        data.update({"picture": instance.get_avatar()})
        return data


class RoleGroupSerializer(ModelSerializer):
    class Meta:
        model = RoleGroup
        fields = ("id", 'name', 'role')
    
    def create(self, validated_data):
        validated_data.update({'company': self.context['request'].user.company})
        role = super().create(validated_data)
        return role
    
    def validate_name(self, attr):
        old_role = RoleGroup.objects.filter(name__iexact=attr, company=self.context['request'].user.company)
        if self.instance:
            old_role = old_role.exclude(id=self.instance.id)
        if old_role.exists():
            raise ValidationError(_("Role group already exists!"))
        return attr



class RedirectUrlParamsSerializer(serializers.Serializer):
    redirect_url = serializers.CharField(validators=(url_field_validator, ))

class ResetPasswordSerializer(serializers.Serializer):
    uidb64 = serializers.CharField(required=True, validators=[
                                    validators.RegexValidator(r'^[0-9A-Za-z_\-]+$', _('Send valid uid'), 'Uid invalid')
                                ])
    token = serializers.CharField(required=True, validators=[
                                    validators.RegexValidator(r'^[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20}$', _('Send valid token'), 'Token invalid')
                                ])
    password = serializers.CharField(required=True, style={'input_type': 'password'}, max_length=50)

    password_confirmation = serializers.CharField(required=True, style={'input_type': 'password'}, max_length=50)
    
    # Hash password
    def validate_password(self, value):
        try:
            validate_password(password=value)
            return value
        except ValidationError as e:
            raise e

    def validate(self, data):
        if data['password'] != data['password_confirmation']:
            raise ValidationError(_("Password must match!"))
        return data


class ForgetPasswordRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=50)

    def validate_email(self, value):
        if not User.objects.filter(email=value, is_active=True):
            raise serializers.ValidationError(_("This email not found"))
        return value