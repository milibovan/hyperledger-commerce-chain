#!/bin/bash
set -e

# No need for 'psql' loop because 'depends_on' healthcheck handles it!
echo "Database is ready (confirmed by healthcheck)!"

# Initialize the database
superset db upgrade

# Create admin user if it doesn't exist
echo "Creating admin user..."
superset fab create-admin \
  --username admin \
  --firstname Admin \
  --lastname User \
  --email admin@superset.com \
  --password admin || echo "Admin user already exists"

# Initialize Superset
echo "Initializing Superset..."
superset init

echo "Starting Superset..."
gunicorn \
  --bind 0.0.0.0:8088 \
  --workers 4 \
  --worker-class gthread \
  --threads 20 \
  --timeout 120 \
  --limit-request-line 0 \
  --limit-request-field_size 0 \
  "superset.app:create_app()"