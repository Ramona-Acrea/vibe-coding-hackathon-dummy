# Minimal FastAPI + React Hello World

## Project Structure

```text
.
├── backend
│   ├── main.py
│   └── requirements.txt
└── frontend
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src
        ├── App.jsx
        └── main.jsx
```

## Backend

Run the FastAPI backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

If `python3 -m venv .venv` says `ensurepip is not available`, install the venv package first:

```bash
sudo apt update
sudo apt install python3.12-venv
```

Then run `python3 -m venv .venv` again.

The backend runs at `http://localhost:8000`.

Test the endpoint:

```bash
curl http://localhost:8000/api/hello
```

Expected JSON:

```json
{ "message": "Hello World" }
```

## Frontend

In a second terminal, run the React frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.
