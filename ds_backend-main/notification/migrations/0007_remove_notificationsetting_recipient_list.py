from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('notification', '0006_recipientlist_branches'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='notificationsetting',
            name='recipient_list',
        ),
    ]
