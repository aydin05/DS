from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('display', '0003_display_heartbeat_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='display',
            name='notifications_enabled',
            field=models.BooleanField(default=True, verbose_name='Notifications Enabled'),
        ),
        migrations.AddField(
            model_name='display',
            name='last_notified_inactive_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Last Notified Inactive'),
        ),
    ]
