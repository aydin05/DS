from rest_framework import serializers
from notification.models import (
    EmailConfig, EmailTemplate, RecipientList, Recipient, NotificationSetting
)


class EmailConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailConfig
        fields = ('id', 'host', 'port', 'username', 'password', 'use_tls', 'from_name', 'is_active')

    def create(self, validated_data):
        validated_data['company'] = self.context['request'].user.company
        return super().create(validated_data)


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = ('id', 'name', 'subject', 'body', 'is_default', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['company'] = self.context['request'].user.company
        return super().create(validated_data)

    def validate_name(self, value):
        company = self.context['request'].user.company
        qs = EmailTemplate.objects.filter(name__iexact=value.strip(), company=company)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("A template with this name already exists.")
        return value


class RecipientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipient
        fields = ('id', 'email', 'name')


class RecipientListSerializer(serializers.ModelSerializer):
    recipients = RecipientSerializer(many=True, read_only=True)
    recipient_count = serializers.SerializerMethodField()
    branch_names = serializers.SerializerMethodField()

    class Meta:
        model = RecipientList
        fields = ('id', 'name', 'description', 'branches', 'branch_names', 'recipients', 'recipient_count', 'created_at', 'updated_at')

    def get_recipient_count(self, obj):
        return obj.recipients.count()

    def get_branch_names(self, obj):
        branches = obj.branches.all()
        if not branches.exists():
            return []
        return [b.name for b in branches]

    def create(self, validated_data):
        branches = validated_data.pop('branches', [])
        validated_data['company'] = self.context['request'].user.company
        instance = super().create(validated_data)
        if branches:
            instance.branches.set(branches)
        return instance

    def update(self, instance, validated_data):
        branches = validated_data.pop('branches', None)
        instance = super().update(instance, validated_data)
        if branches is not None:
            instance.branches.set(branches)
        return instance

    def validate_name(self, value):
        company = self.context['request'].user.company
        qs = RecipientList.objects.filter(name__iexact=value.strip(), company=company)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("A recipient list with this name already exists.")
        return value


class RecipientCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipient
        fields = ('id', 'recipient_list', 'email', 'name')


class NotificationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSetting
        fields = ('id', 'is_enabled', 'inactive_template', 'active_template', 'check_interval_seconds')

    def create(self, validated_data):
        validated_data['company'] = self.context['request'].user.company
        return super().create(validated_data)
