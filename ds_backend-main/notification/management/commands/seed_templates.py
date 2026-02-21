from django.core.management.base import BaseCommand
from account.models import Company
from notification.models import EmailTemplate


TEMPLATES = [
    {
        "name": "Device Offline Alert",
        "subject": "[OFFLINE] {{device_name}} - {{branch_name}}",
        "body": (
            "Hello,\n\n"
            "The following device has gone OFFLINE and is no longer responding:\n\n"
            "  Device:     {{device_name}}\n"
            "  Branch:     {{branch_name}}\n"
            "  Company:    {{company_name}}\n"
            "  Status:     {{status}}\n"
            "  Last Seen:  {{last_heartbeat}}\n\n"
            "Please check the device as soon as possible.\n\n"
            "— Digital Signage Notification System"
        ),
        "is_default": True,
        "template_type": "inactive",
    },
    {
        "name": "Device Back Online Alert",
        "subject": "[ONLINE] {{device_name}} - {{branch_name}}",
        "body": (
            "Hello,\n\n"
            "Good news! The following device is back ONLINE:\n\n"
            "  Device:     {{device_name}}\n"
            "  Branch:     {{branch_name}}\n"
            "  Company:    {{company_name}}\n"
            "  Status:     {{status}}\n"
            "  Last Seen:  {{last_heartbeat}}\n\n"
            "No action is required.\n\n"
            "— Digital Signage Notification System"
        ),
        "is_default": True,
        "template_type": "active",
    },
]


class Command(BaseCommand):
    help = "Seed default email templates (inactive & active) for all companies."

    def handle(self, *args, **options):
        companies = Company.objects.all()
        if not companies.exists():
            self.stdout.write(self.style.WARNING("No companies found."))
            return

        for company in companies:
            for tpl in TEMPLATES:
                obj, created = EmailTemplate.objects.get_or_create(
                    company=company,
                    name=tpl["name"],
                    defaults={
                        "subject": tpl["subject"],
                        "body": tpl["body"],
                        "is_default": tpl["is_default"],
                    },
                )
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(f"  Created '{tpl['name']}' for {company.name}")
                    )
                else:
                    self.stdout.write(f"  '{tpl['name']}' already exists for {company.name}")

        self.stdout.write(self.style.SUCCESS("Done."))
