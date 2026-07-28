# Food Vision Analytics

A full-stack app that estimates a meal's calories and macronutrients from a single photo. Upload a picture of a dish, a fine-tuned EfficientNet-B0 model classifies it, and the API returns calories, protein, fat, and carbs scaled to your portion size - saved to your personal history.

> Results are estimates for informational purposes only, not medical or dietary advice.

## Features

- **Photo → nutrition** - upload a JPEG/PNG, get back the predicted food class, a confidence score, and calories/protein/fat/carbs for the entered portion weight.
- **Personal history** - every upload is logged per user and browsable with pagination.
- **JWT authentication** - register/login, all upload and history endpoints are scoped to the authenticated user.
- **One-command deployment** - PostgreSQL, the FastAPI backend, and the React frontend all run via a single Docker Compose stack.

## Architecture

```text
React SPA (Vite)  →  FastAPI backend  →  ONNX Runtime inference (EfficientNet-B0)
     :8080               :8000                          │
                            │                           ▼
                            └──────────────→  PostgreSQL (users, products, logs)
```

The classifier runs locally inside the backend process (no external ML API) - an uploaded image is preprocessed, classified, matched against a nutrition reference table by predicted class, then scaled by the requested portion weight and persisted.

Design rationale and UML diagrams (Use Case, Activity, Sequence) are in [`docs/SRS_Stage2_System_Design.md`](docs/SRS_Stage2_System_Design.md).

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, React Router 7, Vite 7 |
| Backend | Python 3.10, FastAPI, SQLAlchemy 2.0 (async), Pydantic v2, PyJWT, passlib (bcrypt) |
| ML | EfficientNet-B0 fine-tuned via transfer learning on a 101-class Food-101 subset, exported to ONNX, served with ONNX Runtime |
| Database | PostgreSQL (asyncpg) |
| Infra | Docker, Docker Compose |

## Quick start

Requirements: Docker and Docker Compose.

```bash
cp .env.example .env      # fill in real DB credentials and a JWT secret key
docker compose up --build -d
```

- Frontend: <http://localhost:8080>
- Backend API (Swagger UI): <http://localhost:8000/docs>

Stop everything with:

```bash
docker compose down
```

See [`docs/setup.md`](docs/setup.md) for running the backend or frontend locally without Docker, and for what each environment variable does.

## API overview

All endpoints are under `/api/v1`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | - | Create an account |
| POST | `/auth/login` | - | Exchange credentials for a JWT access token |
| POST | `/consumption/upload` | Bearer | Upload a food photo + portion weight, get a classification and nutrition estimate |
| GET | `/consumption/history` | Bearer | Paginated list of the current user's past uploads |

Full request/response schemas are available at `/docs` (Swagger) once the backend is running.

## Project structure

See [`docs/project-structure.md`](docs/project-structure.md) for the full layout. In short:

```text
backend/    FastAPI service - routes, ML inference, database models
frontend/   React SPA - pages, auth context, API client
docs/       requirements, design, and setup documentation
```

## Documentation

- [`docs/README.md`](docs/README.md) - documentation index
- [`docs/SRS_Stage1_Requirements.md`](docs/SRS_Stage1_Requirements.md) - requirements specification
- [`docs/SRS_Stage2_System_Design.md`](docs/SRS_Stage2_System_Design.md) - system design and UML diagrams
- [`docs/setup.md`](docs/setup.md) - local development setup
- [`docs/project-structure.md`](docs/project-structure.md) - repository layout

## Notes

- The nutrition reference table is a static, versioned seed (`backend/src/db/data/products_export.csv`), not admin-editable at runtime.
- History totals are computed client-side over the currently loaded page, not as a server-side daily/weekly aggregate.
- No automated test suite yet.

## Context

Built during a two-week Data Science / Machine Learning practicum at [Amazinum](https://amazinum.com/), following a staged SDLC: requirements → design → ML pipeline → backend → frontend → testing and documentation.
