"""
ML Inference Engine
===================
Loads the pre-trained Random Forest / XGBoost model and the LabelEncoder,
runs a prediction, and generates a human-readable SHAP-based explanation.

The actual model file is created by running:
    python ml/train_model.py

During development (before the model file exists) a mock fallback is used
so the rest of the API pipeline can be tested end-to-end.
"""
import logging
import os
from typing import Any

import numpy as np
from django.conf import settings

logger = logging.getLogger(__name__)

# Feature order MUST match the column order used during model training
FEATURE_NAMES = ["nitrogen", "phosphorus", "potassium", "ph", "temperature", "humidity", "rainfall"]

# Thresholds for the rule-based explanation generator (used when SHAP is unavailable)
FEATURE_LABELS = {
    "nitrogen":    "Nitrogen (N) level",
    "phosphorus":  "Phosphorus (P) level",
    "potassium":   "Potassium (K) level",
    "ph":          "Soil pH",
    "temperature": "temperature",
    "humidity":    "humidity",
    "rainfall":    "rainfall",
}


def _load_artifacts():
    """
    Lazy-load the model and encoder from disk.
    Returns (model, encoder) or (None, None) on failure.
    """
    try:
        import joblib
        model = joblib.load(settings.ML_MODEL_PATH)
        encoder = joblib.load(settings.ML_ENCODER_PATH)
        logger.info("ML model loaded from %s", settings.ML_MODEL_PATH)
        return model, encoder
    except FileNotFoundError:
        logger.warning(
            "Model file not found at %s — using mock predictor. "
            "Run `python ml/train_model.py` to generate the model.",
            settings.ML_MODEL_PATH,
        )
        return None, None
    except Exception as exc:
        logger.error("Failed to load ML model: %s", exc)
        return None, None


# Module-level singletons (loaded once per worker process)
_model, _encoder = _load_artifacts()


def _mock_predict(features: np.ndarray):
    """
    Fallback when no trained model is available.
    Returns a deterministic pseudo-prediction based on input values
    so the API can still be exercised during development.
    """
    # Simple heuristic: pick crop based on dominant feature ranges
    n, p, k, ph, temp, humidity, rainfall = features[0]

    if ph < 5.5:
        crop, score = "Coffee", 0.72
    elif rainfall > 200:
        crop, score = "Rice", 0.85
    elif temp > 35:
        crop, score = "Cotton", 0.78
    elif n > 100:
        crop, score = "Maize", 0.81
    elif k > 200:
        crop, score = "Banana", 0.76
    else:
        crop, score = "Wheat", 0.80

    alternatives = [
        {"crop": "Lentil", "confidence": round(score - 0.12, 2)},
        {"crop": "Chickpea", "confidence": round(score - 0.18, 2)},
    ]
    return crop, round(score, 2), alternatives


def _build_explanation(crop_name: str, features: dict[str, float], shap_values=None) -> str:
    """
    Converts raw SHAP values (or a simple heuristic) into plain-English reasoning.

    Args:
        crop_name:   The predicted crop.
        features:    Dict of feature_name → value.
        shap_values: Optional 1-D array of SHAP values, same order as FEATURE_NAMES.

    Returns:
        A single explanation string suitable for display to a low-literacy user.
    """
    if shap_values is not None:
        # Flatten shap_values if it's not 1D
        if hasattr(shap_values, 'ndim') and shap_values.ndim > 1:
            shap_values = shap_values.flatten()
        # Only use the first len(FEATURE_NAMES) SHAP values to match features
            valid_len = min(len(shap_values), len(FEATURE_NAMES))
            shap_values = shap_values[:valid_len]
        # Identify the top-3 most influential features (highest |SHAP| value) among valid indices
            indexed = sorted(
                [(idx, shap_values[idx]) for idx in range(valid_len)],
                key=lambda x: abs(x[1]), reverse=True
            )[:3]
        reasons = []
        for idx, shap_val in indexed:
            feat = FEATURE_NAMES[idx]
            label = FEATURE_LABELS[feat]
            direction = "high" if shap_val > 0 else "low"
            reasons.append(f"{label} is {direction} ({features[feat]:.1f})")
        reason_str = "; ".join(reasons)
        return f"{crop_name} is recommended because your {reason_str}."

    # Heuristic fallback explanation
    parts = []
    if features["ph"] < 6.0:
        parts.append("slightly acidic soil pH is ideal")
    elif features["ph"] > 7.5:
        parts.append("alkaline soil pH suits this crop")
    else:
        parts.append("soil pH is in the optimal range")

    if features["rainfall"] > 150:
        parts.append("high rainfall meets water requirements")
    else:
        parts.append("moderate rainfall is sufficient")

    if features["nitrogen"] > 80:
        parts.append("nitrogen-rich soil supports vigorous growth")

    return f"{crop_name} is recommended because your {'; '.join(parts)}."


def predict(input_data: dict[str, Any]) -> dict[str, Any]:
    """
    Main inference function called by the API view.

    Args:
        input_data: Validated dict from PredictionInputSerializer containing
                    nitrogen, phosphorus, potassium, ph, moisture,
                    temperature, humidity, rainfall.

    Returns:
        {
            "crop_name":        str,
            "confidence_score": float (0–1),
            "explanation":      str,
            "alternatives":     [{"crop": str, "confidence": float}, ...]
        }
    """
    # Build feature vector — order must match training
    feature_vector = np.array([[
        input_data["nitrogen"],
        input_data["phosphorus"],
        input_data["potassium"],
        input_data["ph"],
        input_data["temperature"],
        input_data["humidity"],
        input_data["rainfall"],
    ]])

    features_dict = {name: feature_vector[0][i] for i, name in enumerate(FEATURE_NAMES)}


    if _model is None or _encoder is None:
        # ── Mock path (no trained model yet) ──────────────────────────────
        crop_name, confidence, alternatives = _mock_predict(feature_vector)
        explanation = _build_explanation(crop_name, features_dict)
    else:
        # ── Real inference path ───────────────────────────────────────────
        # 1. Get prediction probabilities
        proba = _model.predict_proba(feature_vector)[0]          # shape: (n_classes,)
        top_indices = np.argsort(proba)[::-1]                    # descending by confidence

        predicted_label = top_indices[0]
        try:
            crop_name = _encoder.inverse_transform([predicted_label])[0]
        except Exception as exc:
            logger.error(f"Error in inverse_transform: {exc}; predicted_label={predicted_label}; labels={_encoder.classes_}")
            crop_name = "Unknown"
        confidence = round(float(proba[predicted_label]), 2)

        logger.info(f"ML DEBUG: predicted_label={predicted_label}, crop_name={crop_name}, confidence={confidence}, proba={proba}")

        # 2. Build alternatives (2nd and 3rd ranked crops)
        alternatives = []
        for idx in top_indices[1:3]:
            try:
                alt_name = _encoder.inverse_transform([idx])[0]
            except Exception as exc:
                logger.error(f"Error in alt inverse_transform: {exc}; idx={idx}; labels={_encoder.classes_}")
                alt_name = "Unknown"
            alternatives.append({"crop": alt_name, "confidence": round(float(proba[idx]), 2)})

        # 3. Generate SHAP explanation
        shap_vals = None
        try:
            import shap
            explainer = shap.TreeExplainer(_model)
            shap_output = explainer.shap_values(feature_vector)
            # For multi-class models shap_values is a list; pick the winning class
            if isinstance(shap_output, list):
                shap_vals = shap_output[predicted_label][0]
            else:
                shap_vals = shap_output[0]
        except Exception as exc:
            logger.warning("SHAP explanation failed: %s — using heuristic.", exc)

        explanation = _build_explanation(crop_name, features_dict, shap_vals)

    return {
        "crop_name": crop_name,
        "confidence_score": confidence,
        "explanation": explanation,
        "alternatives": alternatives,
    }
