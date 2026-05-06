"""
ORM Models for the Crop Recommendation System.

Relationships:
    User  ──<  SoilData
    User  ──<  WeatherData
    User  ──<  Recommendation  >──  SoilData
                                >──  WeatherData
                                >──  Crop
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


# ── Custom User Manager ───────────────────────────────────────────────────────

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "researcher")
        return self.create_user(email, password, **extra_fields)


# ── User ──────────────────────────────────────────────────────────────────────

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ("farmer", "Farmer"),
        ("officer", "Agronomist / Outreach Officer"),
        ("researcher", "Researcher"),
    ]

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150)
    contact = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=200, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="farmer")

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    def __str__(self):
        return f"{self.name} ({self.role})"


# ── SoilData ─────────────────────────────────────────────────────────────────

class SoilData(models.Model):
    """Macronutrient and pH readings for a specific farm plot."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="soil_data")
    # Nutrient values in kg/ha (parts per million for pH)
    nitrogen = models.FloatField(help_text="Nitrogen content in kg/ha")
    phosphorus = models.FloatField(help_text="Phosphorus content in kg/ha")
    potassium = models.FloatField(help_text="Potassium content in kg/ha")
    ph = models.FloatField(help_text="Soil pH (0–14)")
    moisture = models.FloatField(help_text="Soil moisture percentage")
    soil_type = models.CharField(
        max_length=20,
        choices=[
            ("Alluvial", "Alluvial"),
            ("Black", "Black"),
            ("Sandy", "Sandy"),
            ("Laterite", "Laterite"),
            ("Mountain", "Mountain"),
        ],
        default="Alluvial",
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"Soil [{self.user.name}] @ {self.timestamp:%Y-%m-%d}"


# ── WeatherData ───────────────────────────────────────────────────────────────

class WeatherData(models.Model):
    """Local weather readings at time of query."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="weather_data")
    temperature = models.FloatField(help_text="Temperature in °C")
    humidity = models.FloatField(help_text="Relative humidity (%)")
    rainfall = models.FloatField(help_text="Rainfall in mm")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"Weather [{self.user.name}] @ {self.timestamp:%Y-%m-%d}"


# ── Crop ─────────────────────────────────────────────────────────────────────

class Crop(models.Model):
    """Reference table with optimal growing conditions per crop."""

    name = models.CharField(max_length=100, unique=True)
    optimal_n = models.FloatField(help_text="Optimal Nitrogen (kg/ha)")
    optimal_p = models.FloatField(help_text="Optimal Phosphorus (kg/ha)")
    optimal_k = models.FloatField(help_text="Optimal Potassium (kg/ha)")
    optimal_ph_min = models.FloatField(default=5.5)
    optimal_ph_max = models.FloatField(default=7.5)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


# ── Recommendation ────────────────────────────────────────────────────────────

class Recommendation(models.Model):
    """Persisted result of the ML inference pipeline."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="recommendations")
    crop = models.ForeignKey(Crop, on_delete=models.SET_NULL, null=True, related_name="recommendations")
    soil_data = models.ForeignKey(SoilData, on_delete=models.SET_NULL, null=True)
    weather_data = models.ForeignKey(WeatherData, on_delete=models.SET_NULL, null=True)

    # ML outputs
    confidence_score = models.FloatField(help_text="Model confidence 0.0–1.0")
    explanation_text = models.TextField(help_text="Human-readable SHAP-based explanation")

    # Second / third ranked alternatives (JSON list of crop names + scores)
    alternatives = models.JSONField(default=list, blank=True)

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        crop_name = self.crop.name if self.crop else "Unknown"
        return f"Rec [{self.user.name}]: {crop_name} ({self.confidence_score:.0%})"
