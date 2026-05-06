# Deployment Checklist — AI Crop Recommendation System

## 1. Local Development Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env              # edit values

python manage.py migrate
python manage.py createsuperuser

# Train the ML model (download Kaggle CSV first, or use synthetic data)
python ml/train_model.py

python manage.py runserver        # → http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm start                         # → http://localhost:3000
```

### Run with Docker (Docker Desktop)

From the project root run:

```powershell
docker compose up --build
```

This will start Postgres, the Django backend at http://localhost:8000 and the frontend at http://localhost:3000.

Environment variables are picked from `backend/.env.example` (copy to `backend/.env` and edit) or override them in `docker-compose.yml`.

Note: the bundled `docker-compose.yml` maps the Postgres container to host port 5433 (host:container -> `5433:5432`) to avoid conflicts with any local Postgres instance. If you prefer to use host port 5432, stop your local Postgres service and change the `ports` mapping in `docker-compose.yml` to `5432:5432`.

---

## 2. Train the ML Model

1. Download **Crop_recommendation.csv** from  
   https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset  
2. Place it at `backend/ml/Crop_recommendation.csv`
3. Run:
   ```bash
   cd backend
   python ml/train_model.py
   ```
   Expected output: `Test accuracy: 0.9900+ (99.0%)`  
   Artifacts saved: `backend/ml/crop_model.joblib`, `backend/ml/label_encoder.joblib`

---

## 3. Deploy to Render (Recommended — Free Tier)

### Backend (Web Service)
| Setting | Value |
|---------|-------|
| Root Dir | `backend` |
| Runtime | Python 3.11 |
| Build Command | `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput` |
| Start Command | `gunicorn crop_recommendation.wsgi:application` |

**Environment Variables** (Render Dashboard → Environment):
```
DJANGO_SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(50))">
DEBUG=False
ALLOWED_HOSTS=your-backend.onrender.com
DB_ENGINE=django.db.backends.postgresql
DB_NAME=<render postgres db name>
DB_USER=<render postgres user>
DB_PASSWORD=<render postgres password>
DB_HOST=<render postgres host>
DB_PORT=5432
CORS_ORIGINS=https://your-frontend.onrender.com
```

Upload the trained `.joblib` files via Render's persistent disk or store them in the repo.

### Frontend (Static Site)
| Setting | Value |
|---------|-------|
| Root Dir | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Dir | `build` |

**Environment Variable:**
```
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

---

## 4. Deploy to Heroku

```bash
# Backend
heroku create cropai-backend
heroku addons:create heroku-postgresql:mini
heroku config:set DJANGO_SECRET_KEY=xxx DEBUG=False ALLOWED_HOSTS=cropai-backend.herokuapp.com
git subtree push --prefix backend heroku main

# Frontend (Heroku static buildpack)
heroku create cropai-frontend
heroku buildpacks:set heroku/nodejs
heroku config:set REACT_APP_API_URL=https://cropai-backend.herokuapp.com/api
git subtree push --prefix frontend heroku main
```

---

## 5. Deploy to AWS (Production)

| Component | Service |
|-----------|---------|
| Django API | **Elastic Beanstalk** (Python) or **ECS Fargate** |
| React SPA | **S3 + CloudFront** |
| Database | **RDS PostgreSQL** |
| ML model files | **S3** (load via `boto3` in `ml_engine.py`) |
| HTTPS | **ACM certificate** on CloudFront / ALB |

---

## 6. Security Checklist (Pre-Launch)

- [ ] `DEBUG=False` in production
- [ ] `SECRET_KEY` generated securely (50+ hex chars), stored in env/secrets manager
- [ ] HTTPS enforced — `SECURE_SSL_REDIRECT=True` in settings
- [ ] `ALLOWED_HOSTS` set to exact domain(s) only
- [ ] Database credentials rotated and not in codebase
- [ ] CORS restricted to your frontend domain only
- [ ] `.env` in `.gitignore`
- [ ] Django admin URL randomised (`/secret-admin-path/` instead of `/admin/`)
- [ ] Rate-limiting middleware added (e.g., `django-ratelimit`)

---

## 7. API Reference (Quick Test with curl)

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@example.com","name":"Ravi","password":"Test1234!","password2":"Test1234!","role":"farmer"}'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -d '{"email":"farmer@example.com","password":"Test1234!"}'
# → copy access token

# Get recommendation
curl -X POST http://localhost:8000/api/recommend/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nitrogen":90,"phosphorus":42,"potassium":43,"ph":6.5,"moisture":60,"temperature":23,"humidity":82,"rainfall":202}'
```
