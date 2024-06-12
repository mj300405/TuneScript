# Use the official Python image as the base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Create a working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y build-essential libpq-dev gettext gcc pkg-config default-libmysqlclient-dev && \
    apt-get install -y libpq-dev python3-dev

# Install Poetry
RUN pip install poetry

# Copy only the necessary files to install dependencies
COPY ../backend/pyproject.toml ../backend/poetry.lock /app/

# Install dependencies
RUN poetry config virtualenvs.create false && poetry install --no-dev --no-interaction --no-ansi

# Explicitly install psycopg2-binary and redis
RUN poetry add psycopg2-binary redis

# Copy the rest of the application code
COPY ../backend/ /app/

# Expose the port the app runs on
EXPOSE 8000

# Run the application
CMD ["poetry", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]
