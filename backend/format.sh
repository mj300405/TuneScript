#!/bin/bash
set -e

cd /app

# echo "Current directory:"
# pwd

# echo "Directory contents:"
# ls -la

echo "Running Black..."
black --config pyproject.toml .

echo "Running isort..."
isort --settings-file pyproject.toml .

echo "Running Flake8..."
flake8 --config .flake8 .