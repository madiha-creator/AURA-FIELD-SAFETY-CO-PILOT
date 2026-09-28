# ---- Stage 1: build the frontend ----
FROM node:22-slim AS frontend
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Python backend serving API + built frontend ----
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY --from=frontend /build/dist ./frontend/dist

ENV ENV=production
ENV PORT=10000
EXPOSE 10000

# One worker (session state lives in memory) with many threads (each voice session holds one).
CMD gunicorn -k gthread -w 1 --threads 100 --timeout 0 -b 0.0.0.0:${PORT} backend.app:app
