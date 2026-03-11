import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('display', '0006_add_indexes_username_heartbeat'),
        ('playlist', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='display',
            name='playlist',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='playlist.playlist'),
        ),
        migrations.AlterField(
            model_name='display',
            name='schedule',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='playlist.schedule'),
        ),
        migrations.AlterField(
            model_name='displaygroup',
            name='playlist',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='playlist.playlist'),
        ),
        migrations.AlterField(
            model_name='displaygroup',
            name='schedule',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='playlist.schedule'),
        ),
    ]
