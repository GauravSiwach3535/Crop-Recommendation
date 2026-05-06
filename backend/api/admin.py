from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, SoilData, WeatherData, Crop, Recommendation


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "name", "role", "is_active", "date_joined"]
    list_filter = ["role", "is_active"]
    search_fields = ["email", "name"]
    ordering = ["-date_joined"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal", {"fields": ("name", "contact", "location", "role")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "name", "role", "password1", "password2")}),
    )


@admin.register(SoilData)
class SoilDataAdmin(admin.ModelAdmin):
    list_display = ["user", "nitrogen", "phosphorus", "potassium", "ph", "moisture", "timestamp"]
    list_filter = ["timestamp"]
    search_fields = ["user__email", "user__name"]


@admin.register(WeatherData)
class WeatherDataAdmin(admin.ModelAdmin):
    list_display = ["user", "temperature", "humidity", "rainfall", "timestamp"]


@admin.register(Crop)
class CropAdmin(admin.ModelAdmin):
    list_display = ["name", "optimal_n", "optimal_p", "optimal_k", "optimal_ph_min", "optimal_ph_max"]
    search_fields = ["name"]


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ["user", "crop", "confidence_score", "timestamp"]
    list_filter = ["crop", "timestamp"]
    search_fields = ["user__email", "crop__name"]
