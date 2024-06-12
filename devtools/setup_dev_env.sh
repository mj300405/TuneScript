#!/bin/bash

# Ensure the script stops if any command fails
set -e

# Navigate to the project directory
cd /mnt/c/Users/Michal/Desktop/TuneScript/devtools

# Start Docker Compose
echo "Starting Docker Compose..."
docker-compose up -d --build

# Open VS Code
echo "Opening VS Code..."
code /mnt/c/Users/Michal/Desktop/TuneScript

echo "Setup complete."
