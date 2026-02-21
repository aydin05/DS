from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('branch', '0001_initial'),
        ('notification', '0005_rename_check_interval_to_seconds'),
    ]

    operations = [
        migrations.AddField(
            model_name='recipientlist',
            name='branches',
            field=models.ManyToManyField(
                blank=True,
                help_text='Branches covered by this recipient list. Leave empty for all branches.',
                related_name='recipient_lists',
                to='branch.Branch',
            ),
        ),
    ]
