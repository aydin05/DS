from rest_framework import serializers
from notification.models import (
    EmailConfig, EmailTemplate, RecipientList, Recipient, NotificationSetting
)


def _mark_existing_offline_displays(branches, company):
    """Mark already-offline displays in newly-added branches as notified,
    so the checker doesn't send false 'newly inactive' alerts for them."""
    if not branches:
        return
    from display.models import Display
    from datetime import timedelta
    from django.utils import timezone
    from core.api.serializers import get_threshold_for_company
    from django.db.models import Q

    threshold_sec = get_threshold_for_company(company)
    threshold = timezone.now() - timedelta(seconds=threshold_sec)

    Display.objects.filter(
        company=company,
        branch__in=branches,
        was_notified_inactive=False,
    ).filter(
        Q(last_heartbeat__lt=threshold) | Q(last_heartbeat__isnull=True)
    ).update(was_notified_inactive=True)


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
        company = self.context['request'].user.company
        validated_data['company'] = company
        instance = super().create(validated_data)
        if branches:
            instance.branches.set(branches)
            _mark_existing_offline_displays(branches, company)
        return instance

    def update(self, instance, validated_data):
        branches = validated_data.pop('branches', None)
        company = self.context['request'].user.company
        old_branch_ids = set(instance.branches.values_list('id', flat=True))
        instance = super().update(instance, validated_data)
        if branches is not None:
            instance.branches.set(branches)
            new_branches = [b for b in branches if b.id not in old_branch_ids]
            _mark_existing_offline_displays(new_branches, company)
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
