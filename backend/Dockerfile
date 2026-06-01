# Production-ready backend image.
FROM python:3.12-slim

# Keep Python lean and predictable inside containers.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install dependencies first to leverage Docker layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code.
COPY app ./app

# Run as a non-root user.
RUN useradd --create-home --uid 1000 appuser
USER appuser

EXPOSE 8000

# Lightweight healthcheck using the stdlib (no curl in slim image).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import os,urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:%s/health' % os.getenv('PORT','8000')).status==200 else 1)" || exit 1

# Gunicorn with Uvicorn workers. Bind to $PORT (PaaS like Railway inject it);
# fall back to 8000 for local Docker Compose. Shell form so $PORT expands.
CMD gunicorn app.main:app -k uvicorn.workers.UvicornWorker -b 0.0.0.0:${PORT:-8000} -w 2
