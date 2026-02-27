from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('display', '0001_initial'),
        ('playlist', '0002_alter_playlist_extra_fields_default'),
    ]

    operations = [
        migrations.CreateModel(
            name='MergedVideo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('content_hash', models.CharField(db_index=True, max_length=64, verbose_name='Content Hash')),
                ('video_file', models.CharField(max_length=500, verbose_name='Video File Path')),
                ('status', models.CharField(
                    choices=[('pending', 'Pending'), ('processing', 'Processing'), ('ready', 'Ready'), ('failed', 'Failed')],
                    default='pending',
                    max_length=20,
                    verbose_name='Status',
                )),
                ('error_message', models.TextField(blank=True, null=True, verbose_name='Error')),
                ('display_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='display.displaytype')),
                ('playlist', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='merged_videos', to='playlist.playlist')),
            ],
            options={
                'unique_together': {('playlist', 'display_type', 'content_hash')},
            },
        ),
    ]
