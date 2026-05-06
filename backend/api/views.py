"""
API Views
=========
Endpoint map:
    POST   /api/auth/register/          → RegisterView
    POST   /api/auth/login/             → CustomTokenObtainPairView
    GET    /api/auth/profile/           → ProfileView
    PUT    /api/auth/profile/           → ProfileView

    POST   /api/recommend/              → RecommendationCreateView  (main ML endpoint)
    GET    /api/recommendations/        → RecommendationListView
    GET    /api/recommendations/<id>/   → RecommendationDetailView

    GET    /api/crops/                  → CropListView
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Crop, Recommendation, SoilData, WeatherData
from .serializers import (
    CropSerializer,
    CustomTokenSerializer,
    PredictionInputSerializer,
    RecommendationSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)
from . import ml_engine


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    """Register a new user. No authentication required."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"message": "Account created successfully.", "email": user.email},
            status=status.HTTP_201_CREATED,
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """Login — returns JWT access + refresh token with user metadata."""
    serializer_class = CustomTokenSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    """Retrieve or update the authenticated user's profile."""
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user


# ── Core ML endpoint ──────────────────────────────────────────────────────────

class RecommendationCreateView(APIView):
    """
    POST /api/recommend/

    Accepts soil + weather data, runs the ML inference pipeline,
    persists SoilData, WeatherData, and Recommendation records,
    and returns the full recommendation payload.

    Request body (JSON):
        {
            "nitrogen": 90, "phosphorus": 42, "potassium": 43,
            "ph": 6.5, "moisture": 60,
            "temperature": 23, "humidity": 82, "rainfall": 202
        }
    """

    def post(self, request):
        # 1. Validate input
        serializer = PredictionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # 2. Persist soil & weather readings
        soil = SoilData.objects.create(
            user=request.user,
            nitrogen=data["nitrogen"],
            phosphorus=data["phosphorus"],
            potassium=data["potassium"],
            ph=data["ph"],
            moisture=data["moisture"],
            soil_type=data["soil_type"],
        )
        weather = WeatherData.objects.create(
            user=request.user,
            temperature=data["temperature"],
            humidity=data["humidity"],
            rainfall=data["rainfall"],
        )

        # 3. Run ML inference  ← This is the integration point
        result = ml_engine.predict(data)

        # 4. Resolve (or create) Crop reference
        crop_obj, _ = Crop.objects.get_or_create(
            name=result["crop_name"],
            defaults={
                "optimal_n": data["nitrogen"],
                "optimal_p": data["phosphorus"],
                "optimal_k": data["potassium"],
                "optimal_ph_min": max(0.0, data["ph"] - 1),
                "optimal_ph_max": min(14.0, data["ph"] + 1),
            },
        )

        # 5. Persist recommendation
        recommendation = Recommendation.objects.create(
            user=request.user,
            crop=crop_obj,
            soil_data=soil,
            weather_data=weather,
            confidence_score=result["confidence_score"],
            explanation_text=result["explanation"],
            alternatives=result["alternatives"],
        )

        # 6. Return serialized recommendation
        out = RecommendationSerializer(recommendation)
        return Response(out.data, status=status.HTTP_201_CREATED)


# ── History endpoints ─────────────────────────────────────────────────────────

class RecommendationListView(generics.ListAPIView):
    """GET /api/recommendations/ — paginated history for the logged-in user."""
    serializer_class = RecommendationSerializer

    def get_queryset(self):
        return Recommendation.objects.filter(user=self.request.user).select_related(
            "crop", "soil_data", "weather_data"
        )


class RecommendationDetailView(generics.RetrieveAPIView):
    """GET /api/recommendations/<id>/ — single recommendation detail."""
    serializer_class = RecommendationSerializer

    def get_queryset(self):
        return Recommendation.objects.filter(user=self.request.user)


# ── Reference data ────────────────────────────────────────────────────────────

class CropListView(generics.ListAPIView):
    """GET /api/crops/ — full catalogue (useful for the frontend dropdown)."""
    serializer_class = CropSerializer
    queryset = Crop.objects.all()
