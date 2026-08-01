# 🚀 Quick Start Guide

Start the entire application with **one command**.

## Windows

### Option 1: Batch File (Recommended)
```batch
start.bat
```
This will:
- ✅ Start Backend (http://localhost:8000)
- ✅ Start Frontend (http://localhost:5173)
- ✅ Open dashboard in browser
- ✅ Keep both services running

### Option 2: PowerShell Script
```powershell
.\start.ps1
```

### Option 3: NPM (if you have Node.js)
```bash
cd code
npm install
npm start
```

---

## macOS / Linux

### Option 1: Bash Script (Recommended)
```bash
cd code
chmod +x start.sh
./start.sh
```

### Option 2: NPM
```bash
cd code
npm install
npm start
```

---

## What Gets Started

| Service | Port | URL |
|---------|------|-----|
| **Frontend** | 5173 | http://localhost:5173 |
| **Backend API** | 8000 | http://localhost:8000 |
| **API Docs** | 8000 | http://localhost:8000/docs |

---

## Manual Startup (If Scripts Don't Work)

### Terminal 1: Backend
```bash
cd code/backend
pip install -r requirements.txt  # Only needed first time
python main.py
```

### Terminal 2: Frontend
```bash
cd code/frontend
npm install  # Only needed first time
npm run dev
```

Then open: **http://localhost:5173**

---

## Troubleshooting

### Port Already in Use
If you get "port already in use" errors:

**Windows:**
```powershell
# Find and kill processes using ports
Get-Process | Where-Object {$_.ProcessName -eq "python"} | Stop-Process -Force
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
```

**macOS/Linux:**
```bash
# Kill processes on port 8000 and 5173
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Backend Won't Start
- Make sure Python 3.8+ is installed: `python --version`
- Install dependencies: `cd code/backend && pip install -r requirements.txt`

### Frontend Won't Start
- Make sure Node.js is installed: `node --version`
- Install dependencies: `cd code/frontend && npm install`

### Can't Connect Backend from Frontend
- Verify backend is running: Open http://localhost:8000/health in browser
- Check frontend `.env` file has: `VITE_API_URL=http://localhost:8000`

---

## Features

✨ **AI-Powered Message Routing**
- Analyzes WhatsApp messages
- Routes to Notify/Digest/Mute
- Detects scams and spam
- Calculates confidence scores

📊 **Beautiful Dashboard**
- Real-time statistics
- Interactive charts
- Message browser
- AI reasoning inspector

---

## Next Steps

1. ✅ Start the application using one of the methods above
2. 📖 Visit http://localhost:5173 to see the dashboard
3. 🔍 Explore the Messages page to see all predictions
4. 📈 Check Analytics for insights
5. 🤖 Use AI Inspector to debug decisions

---

## Environment Variables

The following are configured in `code/.env`:

```
VITE_API_URL=http://localhost:8000
GROQ_API_KEY=your_groq_api_key_here
```

---

**Happy coding!** 🎉
