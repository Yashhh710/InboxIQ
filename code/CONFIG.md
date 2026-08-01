# Configuration Guide

Comprehensive guide for configuring the Orchestrate Dashboard.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Frontend Configuration](#frontend-configuration)
3. [Backend Configuration](#backend-configuration)
4. [Database Configuration](#database-configuration)
5. [API Configuration](#api-configuration)
6. [Theme Configuration](#theme-configuration)
7. [Deployment Configuration](#deployment-configuration)

---

## Environment Variables

### Frontend (.env.local)

Create `frontend/.env.local`:

```bash
# API Configuration
VITE_API_URL=http://localhost:8000

# Optional
VITE_LOG_LEVEL=info
VITE_CACHE_TTL=3600000
VITE_DEBUG=false
```

### Backend (.env)

Create `backend/.env`:

```bash
# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=False

# Dataset Configuration
DATASET_DIR=../dataset

# CORS Configuration
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]

# API Configuration
API_TIMEOUT=30
MAX_CONNECTIONS=100

# Logging
LOG_LEVEL=info
```

### Docker Environment

In `docker-compose.yml`:

```yaml
environment:
  - VITE_API_URL=http://backend:8000
  - PYTHONUNBUFFERED=1
  - DEBUG=False
```

---

## Frontend Configuration

### Vite Configuration (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  server: {
    port: 5173,
    host: '0.0.0.0', // For Docker
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false, // Set to true for debugging
    minify: 'terser',
    target: 'ES2020',
  },
})
```

### TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Tailwind Configuration (tailwind.config.js)

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'accent': '#00d9ff',
        'accent-dim': '#00a8cc',
      },
      backgroundColor: {
        'glass': 'rgba(255, 255, 255, 0.05)',
        'glass-dark': 'rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        'glass': '10px',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### Package Configuration (package.json)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "framer-motion": "^10.16.0",
    "lucide-react": "^0.294.0",
    "recharts": "^2.10.0"
  }
}
```

---

## Backend Configuration

### FastAPI Configuration (main.py)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Orchestrate API",
    description="AI Message Routing API",
    version="1.0.0",
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
]

if not DEBUG:
    origins = [
        "https://your-domain.com",
        "https://app.your-domain.com",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Python Version

```bash
# Minimum
python >= 3.8

# Recommended
python >= 3.11
```

### Dependencies (requirements.txt)

```
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
python-multipart==0.0.6
python-dotenv==1.0.0

# Optional - for production
gunicorn==21.2.0
python-json-logger==2.0.7
psycopg2-binary==2.9.9  # PostgreSQL
```

---

## Database Configuration

### Dataset Location

```python
# In main.py
DATASET_DIR = os.path.join(parent_dir, 'dataset')

# CSV Files Expected:
# - messages.csv
# - users.csv
# - groups.csv
# - businesses.csv
# - history.csv
```

### CSV File Format

**messages.csv:**
```csv
message_id,message_text,sender_user_id,user_id,group_id,business_id,conversation_type,created_at,forwarded_count,media_type
```

**users.csv:**
```csv
user_id,name,preferred_language,timezone,notification_preference
```

**groups.csv:**
```csv
group_id,name,group_type,members_count,created_at
```

---

## API Configuration

### CORS Setup

```python
# Allow specific origins
CORS_ORIGINS = [
    "http://localhost:5173",  # Dev
    "https://app.example.com",  # Production
]

# Or allow all (not recommended for production)
CORS_ORIGINS = ["*"]
```

### Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/messages")
@limiter.limit("100/minute")
async def get_messages(request: Request):
    # Endpoint logic
    pass
```

### Request Timeout

```python
# In FastAPI
timeout = 30  # seconds

# In Axios client (frontend/src/api/client.ts)
const client = axios.create({
  timeout: 30000,  // 30 seconds
  baseURL: API_URL,
})
```

### Response Caching

```python
from fastapi_cache2 import FastAPICache2
from fastapi_cache2.backends.redis import RedisBackend

@app.get("/messages", response_model=List[PredictionResult])
@cached(expire=3600)  # Cache for 1 hour
async def get_messages():
    # Endpoint logic
    pass
```

---

## Theme Configuration

### Color Scheme

```css
/* In src/index.css */
:root {
  --accent: #00d9ff;
  --accent-dim: #00a8cc;
  --glass: rgba(255, 255, 255, 0.05);
  --glass-dark: rgba(0, 0, 0, 0.4);
}
```

### Customizing Colors

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      'primary': '#your-color',
      'secondary': '#your-color',
      'accent': '#00d9ff',
    },
  },
}
```

### Font Configuration

```javascript
// tailwind.config.js
theme: {
  extend: {
    fontFamily: {
      'sans': ['Inter', 'system-ui', 'sans-serif'],
      'mono': ['Fira Code', 'monospace'],
    },
  },
}
```

### Dark Mode

```javascript
// tailwind.config.js
export default {
  darkMode: 'class',
  // ...
}
```

Usage in components:

```typescript
// Toggle dark mode
document.documentElement.classList.toggle('dark')
```

---

## Deployment Configuration

### Docker Configuration

**docker-compose.yml:**

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    environment:
      - DEBUG=False
      - PYTHONUNBUFFERED=1
    volumes:
      - ./dataset:/app/dataset
    ports:
      - "8000:8000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - VITE_API_URL=http://backend:8000
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

### Nginx Configuration

```nginx
upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name example.com;

    # Frontend
    location / {
        root /var/www/orchestrate/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # SSL (optional)
    # listen 443 ssl;
    # ssl_certificate /etc/ssl/certs/certificate.crt;
    # ssl_certificate_key /etc/ssl/private/key.key;
}
```

### Gunicorn Configuration

```python
# gunicorn_config.py
import multiprocessing

bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2
```

Start with:
```bash
gunicorn -c gunicorn_config.py main:app
```

---

## Security Configuration

### HTTPS/SSL

```nginx
listen 443 ssl http2;
ssl_certificate /path/to/certificate.crt;
ssl_certificate_key /path/to/private.key;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
```

### Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

### Environment Secrets

```bash
# Never commit .env files
# Use .env.example as template
# Sync secrets from secure storage

# GitHub Actions example:
env:
  VITE_API_URL: ${{ secrets.API_URL }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Monitoring Configuration

### Logging

```python
# In main.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler(),
    ]
)
```

### Metrics

```python
from prometheus_client import Counter, Histogram

request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration'
)
```

### Health Checks

```python
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": check_database(),
    }
```

---

## Development Configuration

### Debug Mode

```bash
# Frontend
export VITE_DEBUG=true

# Backend
export DEBUG=True

# Logging
export LOG_LEVEL=debug
```

### Hot Reload

```bash
# Frontend (automatic with Vite)
npm run dev

# Backend with auto-reload
pip install python-dotenv
python -m uvicorn main:app --reload
```

### Code Formatting

```bash
# Format Python
pip install black
black backend/

# Format TypeScript
npx prettier --write frontend/src/

# Lint
npx eslint frontend/src/
```

---

## Production Checklist

- [ ] Environment variables configured
- [ ] Debug mode disabled
- [ ] CORS origins restricted
- [ ] SSL/HTTPS enabled
- [ ] Security headers added
- [ ] Database backups automated
- [ ] Logging configured
- [ ] Monitoring enabled
- [ ] Rate limiting active
- [ ] Error tracking setup
- [ ] Documentation updated
- [ ] Performance optimized

---

## Quick Reference

| Component | Config File | Key Setting |
|-----------|------------|------------|
| Frontend | .env.local | VITE_API_URL |
| Backend | .env | DATASET_DIR |
| Vite | vite.config.ts | server.port |
| Tailwind | tailwind.config.js | colors |
| TypeScript | tsconfig.json | strict |
| Docker | docker-compose.yml | ports |
| Nginx | nginx.conf | listen |
| Gunicorn | gunicorn_config.py | workers |

---

For questions, check [README.md](./README.md) or [DEPLOYMENT.md](./DEPLOYMENT.md)

Last Updated: August 2026
