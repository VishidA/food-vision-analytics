# Local Setup

This page describes the current local setup conventions for the repository.

## Python environment

The project uses a local virtual environment stored in `.venv`.

Create it with:

```bash
python3 -m venv .venv
```

Activate it on Linux or macOS with:

```bash
source .venv/bin/activate
```

## Environment variables

Use a local `.env` file for secrets and machine-specific configuration.

Do not commit `.env` to the repository.

## Dependencies

The repository currently does not define a finalized dependency list.


