"""Root URL configuration."""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    # JWT token refresh endpoint
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
