from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('playlist', '0006_schedule_display_type'),
    ]

    operations = [
        migrations.AlterField(
            model_name='schedule',
            name='default_playlist',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to='playlist.playlist',
            ),
        ),
    ]
