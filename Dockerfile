# Use a stable python 3.11 image
FROM python:3.11-slim

# avoid prompts during apt
ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app

# copy only requirements first to use Docker cache
COPY requirements.txt requirements.txt

# install system build deps only while building wheels, then remove them
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential gcc g++ libpq-dev \
 && python -m pip install --upgrade pip setuptools wheel \
 && pip install --no-cache-dir -r requirements.txt \
 && apt-get purge -y --auto-remove build-essential gcc g++ \
 && rm -rf /var/lib/apt/lists/*

# copy the rest of the app
COPY . .

# expose the port Render uses
EXPOSE 8080

# set env so frameworks can read the port (optional)
ENV PORT=8080

# DEFAULT CMD - change app:app to your entrypoint if different
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "120"]
