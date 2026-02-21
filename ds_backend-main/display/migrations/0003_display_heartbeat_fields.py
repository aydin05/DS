from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('display', '0002_auto_20260217_1426'),
    ]

    operations = [
        migrations.AddField(
            model_name='display',
            name='last_heartbeat',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Last Heartbeat'),
        ),
        migrations.AddField(
            model_name='display',
            name='last_heartbeat_source',
            field=models.CharField(
                choices=[('tizen', 'Tizen App'), ('openlink', 'Open Link (Browser)'), ('unknown', 'Unknown')],
                default='unknown',
                max_length=20,
                verbose_name='Heartbeat Source',
            ),
        ),
    ]
