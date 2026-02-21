from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('display', '0004_display_notifications_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='display',
            name='was_notified_inactive',
            field=models.BooleanField(default=False, verbose_name='Was Notified Inactive'),
        ),
    ]
