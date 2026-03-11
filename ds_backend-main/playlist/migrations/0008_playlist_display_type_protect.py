import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('playlist', '0007_schedule_default_playlist_nullable'),
        ('display', '0007_fix_cascade_to_set_null'),
    ]

    operations = [
        migrations.AlterField(
            model_name='playlist',
            name='default_display_type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='display.displaytype'),
        ),
    ]
