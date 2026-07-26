# Stage 1 — Frontend build
FROM node:18 AS frontend-build

WORKDIR /app
COPY frontend/ .
RUN npm install
RUN npm run build


# Stage 2 — Backend build
FROM python:3.10-slim AS backend-build

WORKDIR /app
COPY backend/ .
RUN pip install --no-cache-dir -r requirements.txt


# Stage 3 — Final runtime image
FROM python:3.10-slim

WORKDIR /app

# Copy backend
COPY --from=backend-build /app /app

# Copy frontend build output
COPY --from=frontend-build /app/dist /app/static

EXPOSE 8000
CMD ["python", "backend/main.py"]
