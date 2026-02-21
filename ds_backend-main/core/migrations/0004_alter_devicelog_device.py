import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('display', '0003_display_heartbeat_fields'),
        ('core', '0003_devicelog_device'),
    ]

    operations = [
        migrations.AlterField(
            model_name='devicelog',
            name='device',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='display.display'),
        ),
    ]
