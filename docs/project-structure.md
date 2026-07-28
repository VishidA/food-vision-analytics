# Project Structure

The repository is a monorepo with two independently deployable applications - `backend/` (FastAPI + ML inference) and `frontend/` (React SPA) - plus shared Docker orchestration and documentation.

## Top-level layout

```text
food-vision-analytics/
├── docker-compose.yml        # orchestrates postgres + backend + frontend
├── backend/                  # FastAPI service, ML inference, database layer
├── frontend/                 # React (Vite) single-page app
└── docs/                     # project documentation
```

## `backend/`

```text
backend/
├── Dockerfile
├── requirements.txt
├── main.py                         # FastAPI app, lifespan (DB init + seed), CORS
└── src/
    ├── api/
    │   ├── routes/                 # HTTP endpoints
    │   │   ├── api.py              # aggregates routers under /api/v1
    │   │   ├── auth.py             # /auth/register, /auth/login
    │   │   ├── upload.py           # /consumption/upload
    │   │   └── history.py          # /consumption/history
    │   ├── schemas/                # Pydantic request/response models
    │   ├── services/               # business logic (upload pipeline, JWT issuing)
    │   └── dependencies/           # FastAPI dependencies (current-user resolution)
    ├── core/
    │   ├── config.py               # pydantic-settings, reads .env
    │   └── security.py             # password hashing, JWT decoding
    ├── db/
    │   ├── database.py             # async SQLAlchemy engine/session
    │   ├── models/                 # ORM models: Users, Products, ConsumptionLog
    │   ├── seed_csv.py             # seeds Products from data/products_export.csv on startup
    │   ├── seed_spoonacular.py     # optional: populates Products via the Spoonacular API
    │   └── data/                   # classes.txt, products_export.csv
    └── ml/
        ├── inference.py            # ONNX Runtime inference + preprocessing
        └── model/                  # class_names.json, exported .onnx / .pt weights
```

Layering follows a standard FastAPI service structure: `routes` handle HTTP concerns only, `services` hold business logic, `schemas` define the I/O contract, and `dependencies` wire authentication into routes. `db` and `ml` are separate concerns from `api`, consistent with the module boundaries defined in the SRS (see [`SRS_Stage1_Requirements.md`](SRS_Stage1_Requirements.md), NFR-6).

## `frontend/`

```text
frontend/
├── Dockerfile
├── vite.config.js
└── src/
    ├── api/                  # thin fetch wrappers: client.js, auth.js, consumption.js
    ├── contexts/             # AuthContext (token/session state)
    ├── components/layout/    # Header
    ├── pages/                # LoginPage, UploadPage, HistoryPage
    ├── styles/
    ├── App.jsx               # routes + auth guards
    └── main.jsx
```

Each page owns its API calls via the `api/` wrappers; there is no separate state-management library - auth state lives in `AuthContext`, and page-local state (form values, results) lives in the page components.

## `docs/`

- [`README.md`](README.md) - documentation index
- [`SRS_Stage1_Requirements.md`](SRS_Stage1_Requirements.md) - requirements specification
- [`SRS_Stage2_System_Design.md`](SRS_Stage2_System_Design.md) - UML design (Use Case, Activity, Sequence diagrams)
- [`setup.md`](setup.md) - local development setup
- `images/` - diagram exports referenced by the Stage 2 document
