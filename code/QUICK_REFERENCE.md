# ⚡ Quick Reference - Auto Start Options

## Fastest Way to Start Everything

### From Project Root
```bash
START_APP.bat              # Windows - Double click this!
```

or

```bash
cd code
npm start                  # Any OS with Node.js
```

---

## All Startup Methods

| Method | Platform | Command | Notes |
|--------|----------|---------|-------|
| **START_APP.bat** | Windows | Double-click `START_APP.bat` | ✅ Easiest! |
| **start.bat** | Windows | `cd code && start.bat` | Alternative |
| **start.ps1** | Windows | `cd code && .\start.ps1` | PowerShell |
| **start.sh** | macOS/Linux | `cd code && chmod +x start.sh && ./start.sh` | Bash |
| **npm start** | Any | `cd code && npm start` | Recommended if Node.js installed |
| **Manual** | Any | Open 2 terminals: `python main.py` in backend, `npm run dev` in frontend | Full control |

---

## What Happens When You Start

```
1. Backend starts on port 8000
   ├─ Loads dataset
   ├─ Initializes prediction engine
   └─ API ready at http://localhost:8000

2. Frontend starts on port 5173 (or 5174 if busy)
   ├─ Compiles React app
   ├─ Connects to backend
   └─ Opens dashboard at http://localhost:5173
```

---

## URLs After Starting

| Page | URL |
|------|-----|
| **Dashboard** | http://localhost:5173 |
| **Messages** | http://localhost:5173/messages |
| **Analytics** | http://localhost:5173/analytics |
| **AI Inspector** | http://localhost:5173/inspector |
| **Settings** | http://localhost:5173/settings |
| **API Docs** | http://localhost:8000/docs |

---

## Stop Services

- **npm start:** Press `Ctrl+C` in the terminal
- **start.bat:** Close the command windows
- **start.ps1:** Press `Ctrl+C` in PowerShell
- **start.sh:** Press `Ctrl+C` in terminal

---

## First-Time Setup

Only needed once:

```bash
cd code

# Install Python dependencies
cd backend
pip install -r requirements.txt

# Install Node dependencies
cd ../frontend
npm install

# Back to root
cd ..
```

Then just use any startup method above.

---

## Environment

Current config in `code/.env`:
- ✅ Backend API URL: `http://localhost:8000`
- ✅ Groq API Key: Configured and ready
- ✅ Frontend Dev Port: `5173` (or `5174` if busy)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Close other services or modify port in `.env` |
| Python not found | Install Python 3.8+ |
| npm not found | Install Node.js |
| Backend won't start | Run `pip install -r requirements.txt` in backend/ |
| Frontend won't start | Run `npm install` in frontend/ |
| Can't reach backend | Verify it's running at http://localhost:8000/health |

---

**Tip:** After the first successful startup, you can always just run `npm start` in the `code/` folder for the fastest restart! 🚀
