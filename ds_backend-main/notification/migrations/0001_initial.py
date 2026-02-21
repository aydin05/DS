from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('account', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='EmailConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('host', models.CharField(default='smtp.gmail.com', max_length=255, verbose_name='SMTP Host')),
                ('port', models.PositiveIntegerField(default=587, verbose_name='SMTP Port')),
                ('username', models.EmailField(max_length=255, verbose_name='Email Address')),
                ('password', models.CharField(max_length=255, verbose_name='Email Password')),
                ('use_tls', models.BooleanField(default=True, verbose_name='Use TLS')),
                ('from_name', models.CharField(blank=True, default='', max_length=255, verbose_name='From Name')),
                ('is_active', models.BooleanField(default=True, verbose_name='Active')),
                ('company', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='email_config', to='account.company')),
            ],
            options={
                'verbose_name': 'Email Configuration',
                'verbose_name_plural': 'Email Configurations',
            },
        ),
        migrations.CreateModel(
            name='EmailTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=255, verbose_name='Template Name')),
                ('subject', models.CharField(max_length=500, verbose_name='Subject')),
                ('body', models.TextField(help_text='Available variables: {{device_name}}, {{branch_name}}, {{status}}, {{last_heartbeat}}, {{company_name}}', verbose_name='Body')),
                ('is_default', models.BooleanField(default=False, verbose_name='Default Template')),
                ('company', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='email_templates', to='account.company')),
            ],
            options={
                'verbose_name': 'Email Template',
                'verbose_name_plural': 'Email Templates',
                'unique_together': {('company', 'name')},
            },
        ),
        migrations.CreateModel(
            name='RecipientList',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=255, verbose_name='List Name')),
                ('description', models.TextField(blank=True, default='', verbose_name='Description')),
                ('company', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='recipient_lists', to='account.company')),
            ],
            options={
                'verbose_name': 'Recipient List',
                'verbose_name_plural': 'Recipient Lists',
                'unique_together': {('company', 'name')},
            },
        ),
        migrations.CreateModel(
            name='Recipient',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('email', models.EmailField(max_length=254, verbose_name='Email Address')),
                ('name', models.CharField(blank=True, default='', max_length=255, verbose_name='Name')),
                ('recipient_list', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='recipients', to='notification.recipientlist')),
            ],
            options={
                'verbose_name': 'Recipient',
                'verbose_name_plural': 'Recipients',
                'unique_together': {('recipient_list', 'email')},
            },
        ),
        migrations.CreateModel(
            name='NotificationSetting',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_enabled', models.BooleanField(default=True, verbose_name='Notifications Enabled')),
                ('check_interval_minutes', models.PositiveIntegerField(default=5, help_text='How often to check device status', verbose_name='Check Interval (minutes)')),
                ('company', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='notification_setting', to='account.company')),
                ('email_template', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notification_settings', to='notification.emailtemplate')),
                ('recipient_list', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notification_settings', to='notification.recipientlist')),
            ],
            options={
                'verbose_name': 'Notification Setting',
                'verbose_name_plural': 'Notification Settings',
            },
        ),
    ]
