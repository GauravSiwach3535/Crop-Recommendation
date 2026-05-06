"""
DRF Serializers — validate and transform data between Python objects and JSON.
"""
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User, SoilData, WeatherData, Crop, Recommendation


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "name", "password", "password2", "role", "contact", "location"]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password2"):
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CustomTokenSerializer(TokenObtainPairSerializer):
    """Adds user role and name to the login response payload."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["name"] = user.name
        token["role"] = user.role
        return token


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "name", "contact", "location", "role", "date_joined"]
        read_only_fields = ["id", "email", "date_joined"]


# ── Domain data ───────────────────────────────────────────────────────────────

class SoilDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoilData
        fields = ["id", "nitrogen", "phosphorus", "potassium", "ph", "moisture", "soil_type", "timestamp"]
        read_only_fields = ["id", "timestamp"]


class WeatherDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeatherData
        fields = ["id", "temperature", "humidity", "rainfall", "timestamp"]
        read_only_fields = ["id", "timestamp"]


class CropSerializer(serializers.ModelSerializer):
    class Meta:
        model = Crop
        fields = "__all__"


# ── Recommendation ────────────────────────────────────────────────────────────

class RecommendationSerializer(serializers.ModelSerializer):
    crop = CropSerializer(read_only=True)
    soil_data = SoilDataSerializer(read_only=True)
    weather_data = WeatherDataSerializer(read_only=True)

    class Meta:
        model = Recommendation
        fields = [
            "id", "crop", "soil_data", "weather_data",
            "confidence_score", "explanation_text", "alternatives", "timestamp",
        ]
        read_only_fields = fields


# ── Combined prediction request (input from frontend) ────────────────────────

class PredictionInputSerializer(serializers.Serializer):
    """
    Single payload that the farmer submits from the input form.
    Groups soil + weather into one POST to /api/recommend/.
    """
    # Soil
    nitrogen = serializers.FloatField(min_value=0, max_value=200)
    phosphorus = serializers.FloatField(min_value=0, max_value=200)
    potassium = serializers.FloatField(min_value=0, max_value=300)
    ph = serializers.FloatField(min_value=0, max_value=14)
    moisture = serializers.FloatField(min_value=0, max_value=100)
    soil_type = serializers.ChoiceField(choices=["Alluvial", "Black", "Sandy", "Laterite", "Mountain"])
    # Weather
    temperature = serializers.FloatField(min_value=-20, max_value=60)
    humidity = serializers.FloatField(min_value=0, max_value=100)
    rainfall = serializers.FloatField(min_value=0, max_value=500)
