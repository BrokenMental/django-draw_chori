from django.contrib import admin
from .models import DrawingTemplate


@admin.register(DrawingTemplate)
class DrawingTemplateAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')
    list_filter = ('is_active',)

    def save_model(self, request, obj, form, change):
        if obj.is_active:
            DrawingTemplate.objects.exclude(id=obj.id).update(is_active=False)
        super().save_model(request, obj, form, change)