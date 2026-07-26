FROM python:3.10-slim

WORKDIR /app

# Copy backend from Stage 2
COPY --from=backend-build /app /app

# Copy built frontend assets
COPY --from=frontend-build /app/dist /app/static

EXPOSE 8000

CMD ["python", "backend/main.py"]
