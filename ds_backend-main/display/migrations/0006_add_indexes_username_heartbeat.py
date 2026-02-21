from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('display', '0005_display_was_notified_inactive'),
    ]

    operations = [
        migrations.AlterField(
            model_name='display',
            name='username',
            field=models.CharField(db_index=True, max_length=100, verbose_name='Username'),
        ),
        migrations.AlterField(
            model_name='display',
            name='last_heartbeat',
            field=models.DateTimeField(blank=True, db_index=True, null=True, verbose_name='Last Heartbeat'),
        ),
    ]
