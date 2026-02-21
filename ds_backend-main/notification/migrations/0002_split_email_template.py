from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('notification', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='notificationsetting',
            name='email_template',
        ),
        migrations.AddField(
            model_name='notificationsetting',
            name='inactive_template',
            field=models.ForeignKey(
                blank=True, null=True,
                help_text='Email template sent when a device goes inactive',
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='inactive_notification_settings',
                to='notification.EmailTemplate',
            ),
        ),
        migrations.AddField(
            model_name='notificationsetting',
            name='active_template',
            field=models.ForeignKey(
                blank=True, null=True,
                help_text='Email template sent when a device comes back online',
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='active_notification_settings',
                to='notification.EmailTemplate',
            ),
        ),
    ]
