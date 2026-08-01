# Quick Start Guide

Get the Orchestrate Dashboard running in 5 minutes!

## 🚀 Start Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

**Backend runs at:** http://localhost:8000
**API Docs:** http://localhost:8000/docs

## 🎨 Start Frontend

In a **new terminal:**

```bash
cd frontend
npm install
npm run dev
```

**Frontend runs at:** http://localhost:5173

## ✅ Verify Setup

1. Open http://localhost:5173 in your browser
2. You should see the Orchestrate Dashboard
3. Check the connection indicator in the bottom-left sidebar
   - 🟢 Green = Backend is connected
   - 🔴 Red = Backend connection failed

## 📊 Explore Features

- **Dashboard**: View statistics and charts
- **Messages**: Browse all routed messages with filters
- **Analytics**: Deep insights into patterns
- **AI Inspector**: See AI reasoning for any message
- **Settings**: Configure preferences

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000  # Windows
lsof -i :8000                  # Mac/Linux

# Use different port if needed
python main.py --port 8001
```

### Frontend won't load
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Can't connect to backend
- Verify `VITE_API_URL` in `frontend/.env.local`
- Check backend is running: http://localhost:8000/health
- Check browser console for CORS errors

## 📚 Next Steps

- Read the main [README.md](./README.md) for detailed documentation
- Check API docs at http://localhost:8000/docs
- Explore the code in `frontend/src` and `backend/main.py`

## 🎯 Features Checklist

- ✅ Premium black theme with glassmorphism
- ✅ Responsive layouts
- ✅ Interactive charts and analytics
- ✅ Real-time message routing
- ✅ AI reasoning visualization
- ✅ Error handling and toast notifications
- ✅ Framer Motion animations
- ✅ Full TypeScript support

---

**Ready to route messages with AI?** Let's go! 🚀
