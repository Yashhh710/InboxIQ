# Orchestrate Dashboard

A modern, professional web dashboard for AI-powered message notification routing. Built with React, FastAPI, and Tailwind CSS.

## Overview

This application converts the HackerRank Orchestrate Python prediction engine into a premium web dashboard experience. It preserves the existing AI pipeline while providing a beautiful, intuitive interface for message routing management.

### Features

✨ **Modern UI**
- Premium black theme with glassmorphism design
- Smooth animations with Framer Motion
- Responsive desktop-first layout
- Real-time status indicators

📊 **Dashboard**
- Key statistics (total messages, actions breakdown)
- AI accuracy and confidence metrics
- Interactive charts for notifications, categories, confidence distribution
- User activity and spam detection analytics

💬 **Messages Management**
- Beautiful data table with sorting and pagination
- Advanced filtering (by action, type, conversation)
- Full-text search across message content
- Side drawer with detailed message analysis
- Evidence-based reasoning display

📈 **Analytics**
- Top senders and groups visualization
- Business analytics and trends
- Daily/weekly/monthly trend lines
- Confidence distribution charts
- Message type classification breakdown

🧠 **AI Inspector**
- Message-by-message AI reasoning breakdown
- Visualization of the complete decision pipeline
- Step-by-step reasoning visualization
- Confidence score tracking

⚙️ **Settings**
- Quiet hours configuration
- AI rules management
- Theme selection
- Notification preferences

## Architecture

```
Frontend (React + Vite)
        ↓
REST API (FastAPI)
        ↓
Python Engines
        ↓
Predictions
```

## Project Structure

```
.
├── backend/                          # FastAPI backend
│   ├── main.py                       # FastAPI application with all endpoints
│   └── requirements.txt              # Python dependencies
├── frontend/                         # React + Vite application
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Messages.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── Inspector.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/              # Reusable components
│   │   │   ├── Layout.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── context/                 # React context
│   │   │   └── ToastContext.tsx     # Toast notifications
│   │   ├── api/                     # API client
│   │   │   └── client.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── engines/                          # Existing Python engines
│   ├── notification_router.py
│   ├── spam_detector.py
│   ├── scam_detector.py
│   └── ... (other engines)
├── README.md                         # This file
└── .env.example                      # Environment variables template
```

## Setup Instructions

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Python** 3.8+
- **pip** package manager

### Backend Setup

1. **Install Python dependencies:**

```bash
cd backend
pip install -r requirements.txt
```

2. **Run the FastAPI server:**

```bash
cd backend
python main.py
```

The backend will start at `http://localhost:8000`

**API Documentation:** http://localhost:8000/docs (Swagger UI)

### Frontend Setup

1. **Install Node dependencies:**

```bash
cd frontend
npm install
# or
yarn install
```

2. **Create environment file:**

```bash
cp .env.example .env.local
```

3. **Configure API URL (if needed):**

Edit `frontend/.env.local`:
```
VITE_API_URL=http://localhost:8000
```

4. **Start development server:**

```bash
cd frontend
npm run dev
# or
yarn dev
```

The frontend will start at `http://localhost:5173`

## Usage

### Accessing the Dashboard

1. Start both backend and frontend servers
2. Open http://localhost:5173 in your browser
3. The dashboard will automatically connect to the backend API

### Navigation

- **Dashboard**: Overview of message routing statistics and trends
- **Messages**: View all routed messages with filters and detailed analysis
- **Analytics**: Deep insights into patterns and metrics
- **AI Inspector**: Debug AI reasoning for specific messages
- **Settings**: Configure preferences and AI rules

### Key Features

#### Dashboard
- View total messages processed
- See action distribution (notify/digest/mute)
- Monitor AI accuracy and confidence
- Analyze message categories and spam detection

#### Messages Page
- **Search**: Full-text search across message content
- **Filter by Action**: Notify, Digest, or Mute
- **Filter by Type**: Scam, Spam, Promotion, Urgent, Personal, Event, etc.
- **View Details**: Click any row to see complete message analysis
- **Pagination**: Navigate through message list

#### Analytics
- Track top senders and groups
- Monitor business communication patterns
- View daily, weekly, and monthly trends
- Analyze confidence distribution
- See message type breakdown

#### AI Inspector
- Select any message from the list
- View the complete AI reasoning pipeline
- See each decision step explained
- Monitor confidence score calculation
- Understand evidence used for routing

## API Endpoints

### Health Check
- `GET /health` - API health status

### Messages
- `GET /messages` - Get all messages with filtering
- `GET /messages/{message_id}` - Get detailed message analysis

### Dashboard
- `GET /dashboard` - Get dashboard statistics
- `GET /dashboard/charts` - Get chart data

### Analytics
- `GET /analytics` - Get comprehensive analytics

### Predictions
- `POST /predict` - Predict routing for a single message
- `POST /run-model` - Run full prediction model

### Metadata
- `GET /history` - Get prediction history
- `GET /users` - Get unique users
- `GET /groups` - Get unique groups

## Styling & Theming

### Color Scheme
- **Primary**: Black (#000000)
- **Accent**: Cyan (#00d9ff)
- **Accent Dim**: Blue (#00a8cc)

### Design System
- **Glassmorphism**: Frosted glass effect on cards
- **Animations**: Smooth transitions with Framer Motion
- **Icons**: Lucide React icons
- **Charts**: Recharts for data visualization

### Responsive Design
- Desktop-first approach
- Mobile-friendly layouts
- Adjusts for tablets and smaller screens

## Error Handling

### Components
- **Error Boundary**: Catches React component errors
- **Toast Notifications**: User-friendly error messages
- **Fallback UI**: Empty states and loading skeletons

### Features
- Automatic API error recovery
- Retry mechanisms for failed requests
- Descriptive error messages
- Loading states for all async operations

## Performance Optimizations

- Lazy loading of components
- API response caching
- Optimized chart rendering
- Debounced search input
- Pagination for large datasets

## Development

### Available Scripts

```bash
# Frontend
cd frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint

# Backend
cd backend
python main.py   # Start development server
```

### Code Style

- TypeScript for type safety
- Tailwind CSS for styling
- React hooks for state management
- Functional components throughout

## Deployment

### Frontend (Vercel/Netlify)

```bash
# Build
npm run build

# Deploy the dist/ folder
```

### Backend (Railway/Render)

```bash
# Ensure requirements.txt is up to date
pip freeze > requirements.txt

# Deploy with Python runtime
```

## Troubleshooting

### Backend Connection Issues
- Verify backend is running on http://localhost:8000
- Check `VITE_API_URL` environment variable
- Look for CORS errors in browser console

### Data Not Loading
- Check network tab in browser DevTools
- Verify dataset directory exists
- Check backend logs for errors

### Performance Issues
- Clear browser cache
- Rebuild frontend with `npm run build`
- Check for console warnings

## Technologies Used

### Frontend
- **React** 18 - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **Axios** - HTTP client

### Backend
- **FastAPI** - API framework
- **Python** 3.8+ - Language
- **Pydantic** - Data validation

## License

This project is part of the HackerRank Orchestrate hackathon challenge.

## Support

For issues or questions:
1. Check this README for common solutions
2. Review API documentation at http://localhost:8000/docs
3. Check browser console for errors
4. Review backend logs for API errors

---

Built with ❤️ for WhatsApp message intelligence.
