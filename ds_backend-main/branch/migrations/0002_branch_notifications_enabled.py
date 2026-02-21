from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('branch', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='branch',
            name='notifications_enabled',
            field=models.BooleanField(default=True, verbose_name='Notifications Enabled'),
        ),
    ]
