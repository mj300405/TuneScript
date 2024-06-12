#!/bin/bash

# Ensure the script stops if any command fails
set -e

# Navigate to the project directory
cd /mnt/c/Users/Michal/Desktop/TuneScript/devtools

# Shut down Docker Compose
echo "Shutting down Docker Compose..."
docker-compose down

echo "Shutdown complete."
