from django.db import migrations, models


def convert_minutes_to_seconds(apps, schema_editor):
    NotificationSetting = apps.get_model('notification', 'NotificationSetting')
    for ns in NotificationSetting.objects.all():
        ns.check_interval_seconds = ns.check_interval_seconds * 60
        # Clamp to valid choices (max 300)
        if ns.check_interval_seconds > 300:
            ns.check_interval_seconds = 300
        ns.save(update_fields=['check_interval_seconds'])


class Migration(migrations.Migration):

    dependencies = [
        ('notification', '0004_remove_brevo_fields'),
    ]

    operations = [
        migrations.RenameField(
            model_name='notificationsetting',
            old_name='check_interval_minutes',
            new_name='check_interval_seconds',
        ),
        migrations.RunPython(convert_minutes_to_seconds, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='notificationsetting',
            name='check_interval_seconds',
            field=models.PositiveIntegerField(
                choices=[
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
                ],
                default=300,
                help_text='How often to check device status',
                verbose_name='Check Interval (seconds)',
            ),
        ),
    ]
