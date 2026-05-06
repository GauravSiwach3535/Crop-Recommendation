#!/bin/sh
set -e

# Create migrations if they don't exist and apply them
echo "Creating migrations (if needed) and applying database migrations..."
python manage.py makemigrations --noinput || true
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput || true

# Create superuser automatically if needed
echo "Creating superuser if needed..."
python manage.py create_superuser_auto || true

if [ "$DEBUG" = "True" ] || [ "$DEBUG" = "true" ]; then
  echo "Starting development server..."
  python manage.py runserver 0.0.0.0:8000
else
  echo "Starting Gunicorn..."
  gunicorn crop_recommendation.wsgi:application --bind 0.0.0.0:8000 --workers 3
fi
