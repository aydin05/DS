from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('playlist', '0003_mergedvideo'),
    ]

    operations = [
        migrations.AddField(
            model_name='mergedvideo',
            name='retry_count',
            field=models.PositiveIntegerField(default=0, verbose_name='Retry Count'),
        ),
    ]
