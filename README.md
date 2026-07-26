# FieldFix AI

Prototype FastAPI + React project for maintenance manual search, voice input, and AI suggestions.

## Structure

- `backend/` - FastAPI backend
- `frontend/` - React + Vite + Tailwind frontend
- `Dockerfile` - single container deployable on Render

## Backend

- `backend/app/main.py` - FastAPI app with `/search_manuals` and `/ai_suggestions`
- `backend/app/manual_search.py` - simple PDF text extraction and keyword search
- `backend/requirements.txt` - Python dependencies

## Frontend

- `frontend/src/main.jsx` - React app entry
- `frontend/src/App.jsx` - main UI component
- `frontend/src/index.css` - Tailwind styles
- `frontend/package.json` - frontend dependencies

## Run locally

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host
```

## Docker

The Dockerfile builds the React frontend and bundles it into the same image as
the FastAPI backend, which serves both the API and the static app on a single
port.

```bash
docker build -t fieldfix-ai .
docker run -p 8000:8000 fieldfix-ai
```

Open http://localhost:8000 — the UI and API are served from the same origin.

## Deploying to Render.com

1. Push this repo to GitHub/GitLab and create a new **Web Service** on Render.
2. Choose **Docker** as the runtime (Render will detect the `Dockerfile` at the repo root).
3. No extra environment variables are required — Render sets `PORT` automatically and the container's `CMD` binds to it.
4. Note that the container's filesystem is ephemeral: any manuals/tribal notes uploaded at runtime, and the `ai_cache/` directory, will be reset on redeploy or restart. Attach a [Render persistent disk](https://render.com/docs/disks) if that data needs to survive.
5. The bundled `sentence-transformers` model is baked into the image at build time, but the dependency stack (torch, faiss, scikit-learn) is heavy — pick an instance type with at least 2 GB RAM.
