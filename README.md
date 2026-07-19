# food-vision-analytics

## How to run

This project is set up to run with Docker Compose.

### Requirements

- Docker
- Docker Compose

### Start the project

1. Make sure the root `.env` file exists. It should contain the database credentials used by Compose.
2. From the project root, start all services:

```bash
docker compose up --build -d
```

3. Open the app in your browser:

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000

### Stop the project

```bash
docker compose down
```

### Notes

- The backend uses the `postgres` service name inside Docker, so the database URL is configured automatically in Compose.
- If you want to run services locally without Docker, you need to start Postgres separately and configure `DATABASE_URL` for your local environment.