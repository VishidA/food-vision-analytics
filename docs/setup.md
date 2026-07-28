# Local Setup

Docker Compose is the primary way to run the project (see the root [README](../README.md)). This page covers the environment variables it needs and how to run each service locally without Docker, for development.

## Environment variables

Both the Docker Compose setup and a local run read a `.env` file in the project root. Copy the template and fill in real values:

```bash
cp .env.example .env
```

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_USER` | docker-compose, backend | PostgreSQL username |
| `DATABASE_PASSWORD` | docker-compose, backend | PostgreSQL password |
| `DATABASE_NAME` | docker-compose, backend | PostgreSQL database name |
| `DATABASE_URL` | backend (local run only) | Full async SQLAlchemy URL, e.g. `postgresql+asyncpg://user:pass@localhost:5432/dbname`. Docker Compose builds and injects this automatically - only set it yourself for a local, non-Docker run. |
| `SECURITY_SECRET_KEY` | backend | Signing key for JWT access tokens |
| `SPOONACULAR_API_KEY` | backend | Required by `Settings` at startup; only exercised by `seed_spoonacular.py` (optional nutrition-data enrichment script). Any non-empty placeholder works if you don't run that script. |

Never commit `.env` - it is already covered by `.gitignore`.

## Backend (without Docker)

Requires Python 3.10+ and a running PostgreSQL instance.

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
```

Run the API from the **project root** (the app imports itself as the `backend` package, matching how the Dockerfile runs it):

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

On startup the app creates tables from the ORM models and seeds `Products` from `backend/src/db/data/products_export.csv` if the table is empty.

## Frontend (without Docker)

Requires Node.js 22+.

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:8080` (configured in `vite.config.js`) and expects the backend at `http://127.0.0.1:8000/api/v1`.

## Optional: enriching nutrition data via Spoonacular

`backend/src/db/seed_spoonacular.py` is a standalone script (not run automatically) that looks up each class in `backend/src/db/data/classes.txt` against the Spoonacular API and upserts it into `Products`. Run it manually, with a valid `SPOONACULAR_API_KEY` set:

```bash
python -m backend.src.db.seed_spoonacular
```
