#!/bin/bash

# Ensure the script stops if any command fails
set -e

# Start MySQL service
echo "Starting MySQL service..."
sudo service mysql start

# Navigate to the project directory
echo "Navigating to the project directory..."
cd /mnt/c/Users/Michal/Desktop/TuneScript/backend

# Ensure the Poetry binary is in the path
export PATH="$HOME/.local/bin:$PATH"

# Install dependencies using Poetry
echo "Installing dependencies with Poetry..."
poetry install

# Start Redis server
echo "Starting Redis server..."
sudo service redis-server start

# Run Django migrations using Poetry's environment
echo "Running Django migrations..."
poetry run python manage.py makemigrations
poetry run python manage.py migrate

# Start Celery worker
echo "Starting Celery worker..."
poetry run celery -A tunescript_project worker --loglevel=info &

# Start Django development server
echo "Starting Django development server..."
poetry run python manage.py runserver &

# Open VSCode in the project directory
echo "Opening VSCode..."
code /mnt/c/Users/Michal/Desktop/TuneScript

echo "All services have been started successfully."
