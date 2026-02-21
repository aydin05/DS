from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notification', '0003_emailconfig_provider_apikey'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='emailconfig',
            name='provider',
        ),
        migrations.RemoveField(
            model_name='emailconfig',
            name='api_key',
        ),
        migrations.AlterField(
            model_name='emailconfig',
            name='host',
            field=models.CharField(
                default='smtp.office365.com', max_length=255,
                verbose_name='SMTP Host',
            ),
        ),
        migrations.AlterField(
            model_name='emailconfig',
            name='password',
            field=models.CharField(
                max_length=255, verbose_name='Email Password',
            ),
        ),
    ]
