from django.db import models
from django.db.models import UniqueConstraint
from django.utils.translation import gettext_lazy as _
from dsqmeter.utils.base_model import BaseModel


class EmailConfig(BaseModel):
    """SMTP email configuration per company."""
    company = models.OneToOneField(
        'account.Company', on_delete=models.CASCADE, related_name='email_config'
    )
    host = models.CharField(_("SMTP Host"), max_length=255, default='smtp.office365.com')
    port = models.PositiveIntegerField(_("SMTP Port"), default=587)
    username = models.EmailField(_("Email Address"), max_length=255)
    password = models.CharField(_("Email Password"), max_length=255)
    use_tls = models.BooleanField(_("Use TLS"), default=True)
    from_name = models.CharField(_("From Name"), max_length=255, blank=True, default='Digital Signage')
    is_active = models.BooleanField(_("Active"), default=True)

    class Meta:
        verbose_name = _("Email Configuration")
        verbose_name_plural = _("Email Configurations")
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.company.name} - {self.username}"


class EmailTemplate(BaseModel):
    """Reusable email templates per company."""
    company = models.ForeignKey(
        'account.Company', on_delete=models.CASCADE, related_name='email_templates'
    )
    name = models.CharField(_("Template Name"), max_length=255)
    subject = models.CharField(_("Subject"), max_length=500)
    body = models.TextField(
        _("Body"),
        help_text=_("Available variables: {{device_name}}, {{branch_name}}, {{status}}, {{last_heartbeat}}, {{company_name}}")
    )
    is_default = models.BooleanField(_("Default Template"), default=False)

    class Meta:
        verbose_name = _("Email Template")
        verbose_name_plural = _("Email Templates")
        constraints = [
            UniqueConstraint(fields=['company', 'name'], name='unique_email_template_per_company'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.company.name} - {self.name}"


class RecipientList(BaseModel):
    """Named lists of email recipients per company."""
    company = models.ForeignKey(
        'account.Company', on_delete=models.CASCADE, related_name='recipient_lists'
    )
    name = models.CharField(_("List Name"), max_length=255)
    description = models.TextField(_("Description"), blank=True, default='')
    branches = models.ManyToManyField(
        'branch.Branch', blank=True, related_name='recipient_lists',
        help_text=_("Branches covered by this recipient list. Leave empty for all branches.")
    )

    class Meta:
        verbose_name = _("Recipient List")
        verbose_name_plural = _("Recipient Lists")
        constraints = [
            UniqueConstraint(fields=['company', 'name'], name='unique_recipient_list_per_company'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.company.name} - {self.name}"


class Recipient(BaseModel):
    """Individual email addresses within a recipient list."""
    recipient_list = models.ForeignKey(
        RecipientList, on_delete=models.CASCADE, related_name='recipients'
    )
    email = models.EmailField(_("Email Address"))
    name = models.CharField(_("Name"), max_length=255, blank=True, default='')

    class Meta:
        verbose_name = _("Recipient")
        verbose_name_plural = _("Recipients")
        constraints = [
            UniqueConstraint(fields=['recipient_list', 'email'], name='unique_recipient_per_list'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} <{self.email}>"


class NotificationSetting(BaseModel):
    """Links branches/displays to recipient lists and templates for notifications."""
    company = models.OneToOneField(
        'account.Company', on_delete=models.CASCADE, related_name='notification_setting'
    )
    is_enabled = models.BooleanField(_("Notifications Enabled"), default=True)
    recipient_list = models.ForeignKey(
        RecipientList, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='notification_settings'
    )
    inactive_template = models.ForeignKey(
        EmailTemplate, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='inactive_notification_settings',
        help_text=_("Email template sent when a device goes inactive")
    )
    active_template = models.ForeignKey(
        EmailTemplate, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='active_notification_settings',
        help_text=_("Email template sent when a device comes back online")
    )
    CHECK_INTERVAL_CHOICES = [
        (30, '30 seconds'),
        (60, '1 minute'),
        (90, '1 minute 30 seconds'),
        (120, '2 minutes'),
        (150, '2 minutes 30 seconds'),
        (180, '3 minutes'),
        (210, '3 minutes 30 seconds'),
        (240, '4 minutes'),
        (270, '4 minutes 30 seconds'),
        (300, '5 minutes'),
    ]
    check_interval_seconds = models.PositiveIntegerField(
        _("Check Interval (seconds)"), default=300,
        choices=CHECK_INTERVAL_CHOICES,
        help_text=_("How often to check device status")
    )

    class Meta:
        verbose_name = _("Notification Setting")
        verbose_name_plural = _("Notification Settings")
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.company.name} notifications"
