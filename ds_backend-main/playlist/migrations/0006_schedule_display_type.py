from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('display', '0001_initial'),
        ('playlist', '0005_schedule_branches'),
    ]

    operations = [
        migrations.AddField(
            model_name='schedule',
            name='display_type',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='schedules',
                to='display.displaytype',
            ),
        ),
    ]
