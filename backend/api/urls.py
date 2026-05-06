"""URL routing for the api app."""
from django.urls import path
from . import views

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", views.CustomTokenObtainPairView.as_view(), name="login"),
    path("auth/profile/", views.ProfileView.as_view(), name="profile"),

    # ── ML prediction ──────────────────────────────────────────────────────
    path("recommend/", views.RecommendationCreateView.as_view(), name="recommend"),

    # ── History ────────────────────────────────────────────────────────────
    path("recommendations/", views.RecommendationListView.as_view(), name="recommendation-list"),
    path("recommendations/<int:pk>/", views.RecommendationDetailView.as_view(), name="recommendation-detail"),

    # ── Reference data ─────────────────────────────────────────────────────
    path("crops/", views.CropListView.as_view(), name="crop-list"),
]
