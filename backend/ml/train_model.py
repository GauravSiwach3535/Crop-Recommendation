"""
ML Training Script
==================
Trains a Random Forest classifier on the Kaggle Crop Recommendation Dataset
and saves the model + label encoder with joblib.

Usage:
    # From the backend/ directory:
    python ml/train_model.py

Dataset source:
    https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
    Save the CSV as: backend/ml/Crop_recommendation.csv

If the CSV is absent, a synthetic dataset is generated for demonstration.
"""
import os
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "Crop_recommendation.csv"
MODEL_PATH = BASE_DIR / "crop_model.joblib"
ENCODER_PATH = BASE_DIR / "label_encoder.joblib"

FEATURE_COLS = ["N", "P", "K", "ph", "temperature", "humidity", "rainfall"]
TARGET_COL = "label"


# ── Dataset helpers ───────────────────────────────────────────────────────────

def load_or_generate_dataset() -> pd.DataFrame:
    """Load the Kaggle CSV or fall back to a synthetic dataset."""
    if DATA_PATH.exists():
        print(f"[INFO] Loading dataset from {DATA_PATH}")
        return pd.read_csv(DATA_PATH)

    print("[WARN] Dataset CSV not found — generating synthetic data (1 000 samples).")
    np.random.seed(42)
    n = 1000
    crops = [
        "rice", "maize", "chickpea", "kidneybeans", "pigeonpeas",
        "mothbeans", "mungbean", "blackgram", "lentil", "pomegranate",
        "banana", "mango", "grapes", "watermelon", "muskmelon",
        "apple", "orange", "papaya", "coconut", "cotton",
        "jute", "coffee",
    ]
    records = []
    for _ in range(n):
        crop = np.random.choice(crops)
        records.append({
            "N": np.random.uniform(0, 140),
            "P": np.random.uniform(5, 145),
            "K": np.random.uniform(5, 205),
            "ph": np.random.uniform(3.5, 9.5),
            "temperature": np.random.uniform(8, 44),
            "humidity": np.random.uniform(14, 100),
            "rainfall": np.random.uniform(20, 300),
            "label": crop,
        })
    return pd.DataFrame(records)


# ── Training ──────────────────────────────────────────────────────────────────

def train():
    df = load_or_generate_dataset()

    # Encode target labels
    le = LabelEncoder()
    df["label_enc"] = le.fit_transform(df[TARGET_COL])

    X = df[FEATURE_COLS].values
    y = df["label_enc"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── Model definition ────────────────────────────────────────────────────
    # Random Forest gives >97% accuracy on the Kaggle dataset.
    # To switch to XGBoost:
    #   from xgboost import XGBClassifier
    #   model = XGBClassifier(n_estimators=200, max_depth=6, use_label_encoder=False, eval_metric="mlogloss")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )

    print("[INFO] Training Random Forest…")
    model.fit(X_train, y_train)

    # ── Evaluation ──────────────────────────────────────────────────────────
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"[INFO] Test accuracy: {acc:.4f} ({acc*100:.1f}%)")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    if acc < 0.90:
        print("[WARN] Accuracy below 90%. Consider tuning hyperparameters or using more data.")

    # ── Persist artifacts ────────────────────────────────────────────────────
    joblib.dump(model, MODEL_PATH)
    joblib.dump(le, ENCODER_PATH)
    print(f"[INFO] Model saved   → {MODEL_PATH}")
    print(f"[INFO] Encoder saved → {ENCODER_PATH}")


if __name__ == "__main__":
    train()
