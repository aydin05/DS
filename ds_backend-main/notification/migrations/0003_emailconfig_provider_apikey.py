from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notification', '0002_split_email_template'),
    ]

    operations = [
        migrations.AddField(
            model_name='emailconfig',
            name='provider',
            field=models.CharField(
                choices=[('smtp', 'SMTP'), ('brevo', 'Brevo')],
                default='brevo',
                max_length=20,
                verbose_name='Email Provider',
            ),
        ),
        migrations.AddField(
            model_name='emailconfig',
            name='api_key',
            field=models.CharField(
                blank=True, default='', max_length=255,
                verbose_name='Brevo API Key',
            ),
        ),
        migrations.AlterField(
            model_name='emailconfig',
            name='host',
            field=models.CharField(
                blank=True, default='smtp.gmail.com', max_length=255,
                verbose_name='SMTP Host',
            ),
        ),
        migrations.AlterField(
            model_name='emailconfig',
            name='password',
            field=models.CharField(
                blank=True, default='', max_length=255,
                verbose_name='Email Password / SMTP Password',
            ),
        ),
        migrations.AlterField(
            model_name='emailconfig',
            name='from_name',
            field=models.CharField(
                blank=True, default='Digital Signage', max_length=255,
                verbose_name='From Name',
            ),
        ),
    ]
