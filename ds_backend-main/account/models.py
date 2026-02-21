from django.db import models
from django.contrib.auth.models import AbstractBaseUser,UserManager,PermissionsMixin,Group
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.urls import reverse_lazy
from slugify import slugify
from django.conf import settings
import datetime
from .managers import AccountManager
User_Model = settings.AUTH_USER_MODEL
from django_countries.fields import CountryField
from dsqmeter.utils.base_model import BaseModel
from utils.choices import TIMEZONE_LIST,WEEK_LIST





# Create your models here.
class User(AbstractBaseUser, PermissionsMixin):
    """
    An abstract base class implementing a fully featured User model with
    admin-compliant permissions.
    First name, last name, date of birth and email are required. Other fields are optional.
    """

    fullname = models.CharField(
        _('fullname'),
        max_length=150,
        blank=True,
        null=True,
        unique=False,
        default='user',
        help_text=_(
            'Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.'),
    )
    email = models.EmailField(_('Email'), unique=True)
    phone_number = models.CharField(_("Phone Number"), max_length=15, null=True, blank=True)
    job_title = models.CharField(_("Job Title"), max_length=300, null=True, blank=True)
    company = models.ForeignKey('Company', on_delete=models.CASCADE)
    timezone = models.CharField(_("Timezone"),choices=TIMEZONE_LIST,default="Asia/Dubai",max_length=100)
    branch = models.ManyToManyField('branch.Branch', blank=True)
    role = models.ManyToManyField('RoleGroup', blank=True)
    picture = models.ImageField(
        _('Picture'), upload_to='user_image', blank=True, null=True)
    day_of_week = models.PositiveIntegerField(_('First day of week'), choices=WEEK_LIST, default=1)
    
    is_admin = models.BooleanField(default=False)
    is_master = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    objects = AccountManager()

    """
        Important non-field stuff
    """
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    class Meta:
        verbose_name = 'Account'
        verbose_name_plural = 'Accounts'

    def __str__(self):
        return self.fullname

    def save(self, *args, **kwargs):
        super(User, self).save(*args, **kwargs)


    def get_avatar(self):
        if self.picture:
            return self.picture.url
        return 'https://cdt.org/files/2015/10/2015-10-06-FB-person.png'






class Company(BaseModel):


    name = models.CharField(max_length=100)
    logo = models.ImageField(verbose_name="Logo",
                              upload_to="company", null=True)
    country = CountryField(_("Country"), null=True, blank=True)
    sector = models.CharField(_("Sector"),max_length=100, null=True, blank=True)
    timezone = models.CharField(_("Timezone"),choices=TIMEZONE_LIST,default="Asia/Dubai",max_length=100)



    def __str__(self):
        return self.name






class RoleGroup(BaseModel):
    name = models.CharField(_('Name'), max_length=50)
    role = models.ManyToManyField(Group, verbose_name=_('Role'), blank=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)

    def __str__(self):
        return "{} {}".format(self.company.name, self.name)



class GroupCustom(models.Model):
    group = models.OneToOneField(Group, on_delete=models.CASCADE)
    code = models.SlugField(max_length=50, null=True)

