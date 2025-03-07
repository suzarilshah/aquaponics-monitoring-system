# Use Python 3.9 slim image as base
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
COPY server/requirements.txt server/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir -r server/requirements.txt

# Copy the rest of the application
COPY server/ server/
# No need to copy client/build as it's served separately

# Set the working directory to server
WORKDIR /app/server

# Expose port 6789
EXPOSE 6789

# Command to run the application
CMD ["python", "app.py"]
