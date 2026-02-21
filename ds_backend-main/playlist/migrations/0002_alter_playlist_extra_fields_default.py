from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('playlist', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='playlist',
            name='extra_fields',
            field=models.JSONField(blank=True, default=list, verbose_name='Extra Fields'),
        ),
    ]
