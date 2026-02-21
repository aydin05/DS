from django.contrib import admin
from .models import EmailConfig, EmailTemplate, RecipientList, Recipient

admin.site.register(EmailConfig)
admin.site.register(EmailTemplate)
admin.site.register(RecipientList)
admin.site.register(Recipient)
