from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_companysettings'),
    ]

    operations = [
        migrations.AddField(
            model_name='companyfile',
            name='thumbnail',
            field=models.ImageField(blank=True, null=True, upload_to='company_file/thumbs', verbose_name='Thumbnail'),
        ),
    ]
