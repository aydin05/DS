from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0001_initial'),
        ('core', '0004_alter_devicelog_device'),
    ]

    operations = [
        migrations.CreateModel(
            name='CompanySettings',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('heartbeat_threshold_seconds', models.PositiveIntegerField(
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
                    default=120,
                    help_text='How long without a heartbeat before a device is marked inactive',
                    verbose_name='Heartbeat Threshold (seconds)',
                )),
                ('company', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='settings',
                    to='account.company',
                )),
            ],
            options={
                'verbose_name': 'Company Settings',
                'verbose_name_plural': 'Company Settings',
            },
        ),
    ]
