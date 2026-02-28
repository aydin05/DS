from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from branch.models import Branch
from display.api.serializers import DisplaySerializer
from display.models import Display
from rest_framework import pagination
from django.db.models import Q

class BranchSerializer(ModelSerializer):
    display = serializers.SerializerMethodField()
    class Meta:
        model = Branch
        fields = ("id", 'name', 'description', 'timezone', 'notifications_enabled', 'display')
    
    def create(self, validated_data):
        validated_data.update({'company': self.context['request'].user.company})
        branch = super().create(validated_data)
        return branch

    def update(self, instance, validated_data):
        new_notif = validated_data.get('notifications_enabled')
        old_notif = instance.notifications_enabled
        branch = super().update(instance, validated_data)
        if new_notif is not None and new_notif != old_notif:
            Display.objects.filter(branch=branch).update(notifications_enabled=new_notif)
        return branch
    
    def get_display(self, obj):
        pk = self.context['view'].kwargs.get('pk', None)
        search = self.context['request'].query_params.get('search', None)
        if pk is not None and search is not None:
            displays = Display.objects.filter(Q(name__icontains=search) | Q(description__icontains=search),branch=obj).order_by("username")
        elif pk is None:
            displays = Display.objects.filter(branch=obj).order_by("username")
            return DisplaySerializer(displays, many=True).data
        else:
            displays = Display.objects.filter(branch=obj).order_by("username")
        paginator = pagination.PageNumberPagination()
        page = paginator.paginate_queryset(displays, self.context['request'])
        serializer = paginator.get_paginated_response(DisplaySerializer(page, many=True).data)
        return serializer.data


    def validate_name(self, attrs):
        old_branch = Branch.objects.filter(name__iexact=attrs.strip(), company=self.context['request'].user.company)
        if self.instance:
            old_branch = old_branch.exclude(id=self.instance.id)
        if old_branch.exists():
            raise serializers.ValidationError("Branch name already exists")
        return super().validate(attrs)
        
