# InboxIQ

An intelligent message triage and notification routing system. It analyzes incoming messages (personal, business, group, promotional, etc.) and decides whether to **notify**, **digest**, or **mute** them — with a full analytics dashboard to inspect the decisions.

- **Live app**: https://inbox-iq-hack.vercel.app/
- **Live API**: https://inboxiq-9903.onrender.com

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript, Tailwind CSS, Recharts, Framer Motion |
| Backend | FastAPI (Python), Pydantic |
| Data | CSV-based dataset (no database) |
| Frontend hosting | Vercel |
| Backend hosting | Render |

## Project Structure

```
InboxIQ/
├── dataset/              # CSV data (messages, users, groups, businesses, etc.)
└── code/
    ├── main.py            # Standalone script — runs the prediction pipeline over the dataset
    ├── engines/           # Core logic: reasoning, scam/spam detection, routing, etc.
    ├── backend/           # FastAPI app (serves the dashboard's API)
    │   ├── main.py
    │   └── requirements.txt
    └── frontend/          # React + Vite dashboard
        ├── src/
        └── package.json
```

## Running Locally

### 1. Backend

```bash
cd code/backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 main.py
```

Runs on `http://localhost:8000`. Verify with:
```bash
curl http://localhost:8000/health
```

> **Note (macOS with Python 3.13+/3.14):** `pydantic-core==2.14.1` has no prebuilt wheel for very new Python versions and will fail to compile. If you hit this, create the venv with an older Python instead, e.g. `python3.11 -m venv venv` (install via `brew install python@3.11` if needed).

### 2. Frontend

In a separate terminal:
```bash
cd code/frontend
npm install
npm run dev
```

Opens on `http://localhost:5173` and talks to the backend via `VITE_API_URL` (set in `code/frontend/.env`, defaults to `http://localhost:8000`).

### 3. (Optional) Standalone prediction pipeline

To just run the core engine over the dataset without the API/dashboard:
```bash
cd code
python3 main.py
```
Writes results to `dataset/output.csv`.

## API Reference

Base URL: backend root (e.g. `https://inboxiq-9903.onrender.com`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/messages` | List messages (filterable by action/type, paginated) |
| GET | `/messages/{message_id}` | Single message detail + prediction |
| GET | `/dashboard` | Summary stats for the dashboard home |
| GET | `/dashboard/charts` | Chart data for the dashboard |
| GET | `/analytics` | Analytics data (senders, groups, trends, distributions) |
| POST | `/predict` | Run the model on a single message payload |
| POST | `/run-model` | Re-run the full model over the dataset |
| GET | `/history` | Notification history |
| GET | `/users` | User list |
| GET | `/groups` | Group list |
| GET | `/directory` | Group/business ID → display name lookup |

There's no route at `/` — hitting the bare backend URL in a browser will correctly return `{"detail":"Not Found"}`.

## Deployment

### Backend → Render

1. New Web Service → connect this repo, branch `main`
2. **Root Directory**: `code/backend`
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Environment Variable**: `PYTHON_VERSION=3.11.9` (avoids a `pydantic-core` build failure on newer Python versions Render defaults to)
6. Deploy, then verify at `https://<your-service>.onrender.com/health`

> Free tier spins down after inactivity — first request after idling can take ~30–50s to wake up.

### Frontend → Vercel

1. New Project → import this repo
2. **Root Directory**: `code/frontend`
3. Framework preset: **Vite** (auto-detected)
4. **Environment Variable**:
   - `VITE_API_URL` = your Render backend URL (e.g. `https://inboxiq-9903.onrender.com`)
5. Deploy

> Vite bakes env vars in at build time — if you add/change `VITE_API_URL` after the first deploy, you must **redeploy** for it to take effect.

## Known Notes

- CORS is open (`allow_origins=["*"]`) on the backend, so any frontend origin can call it.
- The backend is read-only at request time — no CSV files are written during normal API use, so it's safe to run on ephemeral/serverless-style hosts.
