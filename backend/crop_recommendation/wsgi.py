"""WSGI config for crop_recommendation project."""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "crop_recommendation.settings")
application = get_wsgi_application()
