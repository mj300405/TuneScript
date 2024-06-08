#!/bin/bash

# Start MySQL service
echo "Starting MySQL service..."
sudo service mysql start

# Navigate to the project directory
cd /mnt/c/Users/Michal/Desktop/TuneScript/backend

# Check if the virtual environment exists
if [ ! -d "venv" ]; then
  echo "Virtual environment not found. Creating a new virtual environment..."
  python3 -m venv venv
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Check if the virtual environment is activated and Django is installed
if ! python -c "import django" &> /dev/null; then
    echo "Django is not installed or the virtual environment is not activated. Installing Django..."
    pip install django
fi

# Run Django migrations
echo "Running Django migrations..."
python manage.py makemigrations
python manage.py migrate

# Open VSCode in the project directory
echo "Opening VSCode..."
code .
