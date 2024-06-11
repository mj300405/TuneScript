#!/bin/bash

# Start MySQL service
echo "Starting MySQL service..."
sudo service mysql start

# Navigate to the project directory
cd /mnt/c/Users/Michal/Desktop/TuneScript/backend

# Install dependencies using Poetry
echo "Installing dependencies with Poetry..."
poetry install

# Run Django migrations using Poetry's environment
echo "Running Django migrations..."
poetry run python manage.py makemigrations
poetry run python manage.py migrate

# Open VSCode in the project directory
echo "Opening VSCode..."
code .