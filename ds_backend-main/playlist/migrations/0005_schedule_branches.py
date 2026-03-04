from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('branch', '0001_initial'),
        ('playlist', '0004_add_retry_count_to_mergedvideo'),
    ]

    operations = [
        migrations.AddField(
            model_name='schedule',
            name='branches',
            field=models.ManyToManyField(blank=True, related_name='schedules', to='branch.branch'),
        ),
    ]
