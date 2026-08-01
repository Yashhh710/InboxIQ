# Testing Guide

Comprehensive testing instructions for the Orchestrate Dashboard.

## Table of Contents

1. [Setup Verification](#setup-verification)
2. [Backend Testing](#backend-testing)
3. [Frontend Testing](#frontend-testing)
4. [Integration Testing](#integration-testing)
5. [Performance Testing](#performance-testing)

---

## Setup Verification

### Quick System Check

```bash
# Check Node version (should be 18+)
node --version

# Check npm
npm --version

# Check Python version (should be 3.8+)
python --version

# Check pip
pip --version
```

### Backend Connectivity

```bash
# Health check
curl http://localhost:8000/health

# Should return:
# {"status":"ok","timestamp":"...","dataset":"..."}

# API documentation
# Open in browser: http://localhost:8000/docs
```

### Frontend Connectivity

```bash
# Check frontend is running
curl http://localhost:5173/

# Check connection to backend
curl http://localhost:5173/api/health
```

---

## Backend Testing

### 1. Health Endpoint

```bash
curl -X GET http://localhost:8000/health

# Expected: 200 OK
# Response: {"status":"ok",...}
```

### 2. Messages Endpoint

```bash
# Get all messages
curl http://localhost:8000/messages

# With filters
curl "http://localhost:8000/messages?action=notify&skip=0&limit=10"

# Search
curl "http://localhost:8000/messages?search=urgent"

# Expected: Array of predictions
```

### 3. Dashboard Endpoint

```bash
# Get statistics
curl http://localhost:8000/dashboard

# Expected: 
# {
#   "total_messages": number,
#   "notify_count": number,
#   "digest_count": number,
#   "mute_count": number,
#   "ai_accuracy": float,
#   "confidence_average": float
# }
```

### 4. Charts Endpoint

```bash
# Get chart data
curl http://localhost:8000/dashboard/charts

# Expected: Multiple chart datasets
```

### 5. Analytics Endpoint

```bash
# Get analytics
curl http://localhost:8000/analytics

# Expected: 
# {
#   "top_senders": [...],
#   "group_analytics": [...],
#   "business_analytics": [...],
#   ...
# }
```

### 6. Prediction Endpoint

```bash
# Test single prediction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "message_id": "test123",
    "message_text": "Urgent: Please call me back",
    "sender_user_id": "user1",
    "user_id": "user2",
    "conversation_type": "personal"
  }'

# Expected: Prediction result with action, confidence, etc.
```

### 7. Run Model Endpoint

```bash
# Run full model
curl -X POST http://localhost:8000/run-model

# Expected: 
# {
#   "status": "success",
#   "total_messages": number,
#   "predictions": [...]
# }
```

---

## Frontend Testing

### 1. Browser Console

Open DevTools (F12) → Console tab

Check for:
- ✅ No errors in red
- ✅ No warnings in yellow (except minor ones)
- ✅ API calls shown in Network tab

### 2. Responsive Design

```
Desktop (1920x1080)     → Full sidebar visible
Tablet (768x1024)       → Responsive layout
Mobile (375x667)        → Mobile-friendly (if implemented)
```

### 3. Page Navigation

Test each page loads:

```
/ (Dashboard)           → Shows stats and charts
/messages               → Shows message table
/analytics              → Shows analytics charts
/inspector              → Shows AI inspector
/settings               → Shows settings form
```

### 4. Dashboard Tests

- [ ] Stats cards display numbers
- [ ] Charts load and render
- [ ] Pie chart is interactive (hover)
- [ ] Bar charts show data
- [ ] Area chart animates smoothly
- [ ] Confidence metrics display

### 5. Messages Page Tests

- [ ] Table displays messages
- [ ] Search box works
- [ ] Filter by action works (Notify/Digest/Mute)
- [ ] Filter by type works
- [ ] Pagination works (Next/Previous)
- [ ] Click row opens detail drawer
- [ ] Drawer shows message details
- [ ] Close button works

### 6. Analytics Page Tests

- [ ] Loads analytics data
- [ ] Top senders list displays
- [ ] Charts render correctly
- [ ] Daily trends show data
- [ ] Scroll works

### 7. Inspector Tests

- [ ] Search loads messages
- [ ] Select message shows it
- [ ] Analyze button works
- [ ] Reasoning steps display
- [ ] Confidence bar animates

### 8. Settings Tests

- [ ] Quiet hours toggle works
- [ ] Start/end time inputs work
- [ ] AI rules toggle works
- [ ] Theme selection works
- [ ] Save button shows success toast

---

## Integration Testing

### Full Flow Test

```
1. Start backend
   ✓ http://localhost:8000/health returns OK

2. Start frontend
   ✓ http://localhost:5173/ loads

3. Dashboard opens
   ✓ Stats cards show numbers
   ✓ Charts display

4. Go to Messages
   ✓ Table loads with data
   ✓ Can filter and search

5. Select a message
   ✓ Detail drawer opens
   ✓ Shows prediction details

6. Go to Analytics
   ✓ Charts display
   ✓ Data looks correct

7. Go to Inspector
   ✓ Can select message
   ✓ Shows reasoning

8. Go to Settings
   ✓ Can toggle options
   ✓ Save works

9. Check notification
   ✓ Toast appears
```

### Error Handling Test

```
1. Disconnect backend
   ✓ Frontend shows connection error
   ✓ Toast notifications appear
   ✓ Pages show empty states

2. Reconnect backend
   ✓ Data loads again
   ✓ Connection restored

3. Cause API error
   ✓ Error toast displays
   ✓ Page doesn't crash
```

### Performance Test

```
1. Dashboard load time
   ✓ < 3 seconds total
   ✓ Charts render smoothly

2. Messages pagination
   ✓ < 1 second load
   ✓ 50 items display

3. Search responsiveness
   ✓ Debounces input
   ✓ Shows results quickly

4. Chart interactions
   ✓ 60fps animations
   ✓ Hover effects smooth
```

---

## Performance Testing

### Frontend Performance

**Lighthouse Audit (Chrome DevTools)**

```
1. Open DevTools → Lighthouse
2. Run audit
3. Check scores:
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 90
```

**Bundle Size**

```bash
cd frontend
npm run build

# Check dist/ folder size
# Should be < 500KB (gzipped)
```

**Load Time**

```
Time to Interactive: < 3 seconds
First Contentful Paint: < 1.5 seconds
Largest Contentful Paint: < 2.5 seconds
```

### Backend Performance

**API Response Time**

```bash
# Time the health endpoint
time curl http://localhost:8000/health

# Should be < 10ms

# Time messages endpoint
time curl http://localhost:8000/messages

# Should be < 100ms
```

**Database Query Performance**

```bash
# Monitor memory usage
top -p $(pgrep -f gunicorn)

# Should stay < 500MB
```

---

## Browser Compatibility

### Desktop Browsers

- [x] Chrome/Chromium 90+
- [x] Firefox 88+
- [x] Safari 14+
- [x] Edge 90+

### Mobile Browsers

- [x] Chrome Mobile
- [x] Safari iOS 14+
- [x] Firefox Mobile

### Test Command (if using BrowserStack)

```bash
# Configure browserstack.json with credentials
npx browserstack-local

# Run tests across browsers
```

---

## Automated Testing

### Frontend Unit Tests

```bash
# Setup Jest
npm install --save-dev jest @testing-library/react

# Create test file
# src/components/__tests__/StatCard.test.tsx

# Run tests
npm test

# Coverage
npm test -- --coverage
```

Example test:

```typescript
import { render, screen } from '@testing-library/react'
import StatCard from '../StatCard'

test('renders stat value', () => {
  render(<StatCard title="Test" value="123" />)
  expect(screen.getByText('123')).toBeInTheDocument()
})
```

### Backend Unit Tests

```bash
# Install pytest
pip install pytest httpx

# Create test file
# tests/test_api.py

# Run tests
pytest tests/ -v
```

Example test:

```python
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

---

## Manual Testing Checklist

### Daily Checks

- [ ] Backend starts without errors
- [ ] Frontend loads successfully
- [ ] Connection indicator shows green
- [ ] Dashboard loads with data
- [ ] Can navigate all pages
- [ ] Search functionality works
- [ ] Filters apply correctly
- [ ] Charts render smoothly
- [ ] No console errors

### Weekly Checks

- [ ] Full end-to-end flow works
- [ ] Error handling works properly
- [ ] Performance is acceptable
- [ ] All animations smooth
- [ ] Responsive on different sizes
- [ ] Toast notifications display
- [ ] No memory leaks
- [ ] No slow network issues

### Release Checklist

- [ ] All tests pass
- [ ] No console warnings
- [ ] No TypeScript errors
- [ ] All pages functional
- [ ] Performance within limits
- [ ] Documentation updated
- [ ] .env.example updated
- [ ] Version bumped
- [ ] CHANGELOG updated

---

## Debugging Tips

### Frontend Debugging

```javascript
// In browser console
// Check API connection
fetch('http://localhost:8000/health').then(r => r.json()).then(console.log)

// Check current state
// (if using Redux DevTools)
window.__REDUX_DEVTOOLS_EXTENSION__

// Performance profiling
performance.measure('myMeasure')
```

### Backend Debugging

```python
# Add logging
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
logger.debug(f"Processing message: {message_id}")

# Use pdb for breakpoints
import pdb; pdb.set_trace()

# Monitor with htop
htop -p $(pgrep -f gunicorn)
```

---

## Test Report Template

```markdown
## Test Date: [DATE]

### Environment
- Backend: ✅ Running
- Frontend: ✅ Running
- Python: [VERSION]
- Node: [VERSION]

### Results
- Dashboard: ✅ PASS
- Messages: ✅ PASS
- Analytics: ✅ PASS
- Inspector: ✅ PASS
- Settings: ✅ PASS

### Performance
- Dashboard load: [TIME]ms
- API response: [TIME]ms
- Charts render: [TIME]ms

### Issues Found
- None

### Notes
[Any observations]
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          pip install -r backend/requirements.txt
          npm install
      
      - name: Run backend tests
        run: pytest
      
      - name: Run frontend tests
        run: npm test
      
      - name: Build frontend
        run: npm run build
```

---

## Quick Test Commands

```bash
# Backend
curl http://localhost:8000/health
curl http://localhost:8000/messages
curl http://localhost:8000/dashboard

# Frontend
npm run dev
npm run build
npm test

# Both
docker-compose up
docker-compose exec backend pytest
docker-compose exec frontend npm test
```

---

**Testing ensures quality and reliability. Always test before deploying!**

Last Updated: August 2026
