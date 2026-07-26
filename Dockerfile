# ───────────────────────────────────────────────
# Stage 1 — Build Frontend (React + Vite)
# ───────────────────────────────────────────────
FROM node:18 AS frontend-build

# Set working directory
WORKDIR /app

# Copy ONLY the frontend folder into container root
COPY frontend/ .

# Install dependencies and build
RUN npm install
RUN npm run build


# ───────────────────────────────────────────────
# Stage 2 — Build Backend (Python)
# ───────────────────────────────────────────────
FROM python:3.12-slim AS backend-build

WORKDIR /app

# Copy backend code
COPY backend/ .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt


# ───────────────────────────────────────────────
# Stage 3 — Final Runtime Image
# ───────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Copy backend from Stage 2
COPY --from=backend-build /app /app

# Copy built frontend assets from Stage 1
COPY --from=frontend-build /app/dist /app/static

# Expose port (Render uses PORT env var)
EXPOSE 8000

# Start your backend server (adjust if using FastAPI, Flask, Django)
CMD ["python", "main.py"]
