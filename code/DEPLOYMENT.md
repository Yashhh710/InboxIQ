# Deployment Guide

Complete guide for deploying the Orchestrate Dashboard to production.

## Table of Contents

1. [Docker Deployment](#docker-deployment)
2. [Manual Deployment](#manual-deployment)
3. [Cloud Deployment](#cloud-deployment)
4. [Production Checklist](#production-checklist)

---

## Docker Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 1.29+

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild after code changes
docker-compose up -d --build
```

**Services:**
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

### Building Individual Images

**Backend:**
```bash
docker build -f backend/Dockerfile -t orchestrate-backend:latest .
docker run -p 8000:8000 \
  -v $(pwd)/dataset:/app/dataset \
  orchestrate-backend:latest
```

**Frontend:**
```bash
cd frontend
docker build -t orchestrate-frontend:latest .
docker run -p 5173:5173 \
  -e VITE_API_URL=http://localhost:8000 \
  orchestrate-frontend:latest
```

---

## Manual Deployment

### Backend Deployment

1. **On Production Server:**

```bash
# Clone repository
git clone <repo-url>
cd orchestrate-dashboard

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install dependencies
cd backend
pip install -r requirements.txt

# Run with production server (gunicorn)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

2. **Using systemd (Linux):**

Create `/etc/systemd/system/orchestrate-backend.service`:

```ini
[Unit]
Description=Orchestrate Backend
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/opt/orchestrate
Environment="PATH=/opt/orchestrate/venv/bin"
ExecStart=/opt/orchestrate/venv/bin/gunicorn -w 4 -b 127.0.0.1:8000 main:app
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable orchestrate-backend
sudo systemctl start orchestrate-backend
sudo systemctl status orchestrate-backend
```

### Frontend Deployment

1. **Build:**

```bash
cd frontend
npm install
npm run build
```

2. **Deploy dist/ folder:**

**Using Nginx:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/orchestrate-dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Using Apache:**

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/orchestrate-dashboard/dist

    <Directory /var/www/orchestrate-dashboard/dist>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA routing
        <IfModule mod_rewrite.c>
            RewriteEngine On
            RewriteBase /
            RewriteRule ^index\.html$ - [L]
            RewriteCond %{REQUEST_FILENAME} !-f
            RewriteCond %{REQUEST_FILENAME} !-d
            RewriteRule . /index.html [L]
        </IfModule>
    </Directory>

    # Proxy API requests
    ProxyPreserveHost On
    ProxyPass /api http://localhost:8000/
    ProxyPassReverse /api http://localhost:8000/
</VirtualHost>
```

---

## Cloud Deployment

### Vercel (Frontend)

1. **Connect repository** to Vercel
2. **Configure:**
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
3. **Environment variables:**
   ```
   VITE_API_URL=https://your-api.com
   ```

### Render (Backend)

1. **Create new Web Service**
2. **Configure:**
   - Repository: Select your repo
   - Build command: `pip install -r backend/requirements.txt`
   - Start command: `gunicorn -w 4 -b 0.0.0.0:$PORT backend/main:app`
   - Runtime: Python 3.11

### Railway

1. **Connect GitHub**
2. **Environment variables:**
   ```
   PYTHONUNBUFFERED=1
   ```
3. **Start command:**
   ```bash
   python backend/main.py
   ```

### AWS EC2

1. **Launch Ubuntu 22.04 instance**

2. **Setup:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and Node
sudo apt install python3.11 python3.11-venv nodejs npm -y

# Clone repository
cd /opt
sudo git clone <repo-url> orchestrate
cd orchestrate

# Setup backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Setup frontend
cd ../frontend
npm install
npm run build

# Install Nginx
sudo apt install nginx -y

# Configure Nginx (see Nginx config above)
sudo nano /etc/nginx/sites-available/default

# Start services
sudo systemctl start nginx
nohup gunicorn -w 4 -b 127.0.0.1:8000 main:app > backend.log 2>&1 &
```

### Docker Hub Deployment

```bash
# Tag images
docker tag orchestrate-backend:latest your-username/orchestrate-backend:latest
docker tag orchestrate-frontend:latest your-username/orchestrate-frontend:latest

# Push to Docker Hub
docker push your-username/orchestrate-backend:latest
docker push your-username/orchestrate-frontend:latest

# On production server
docker-compose pull
docker-compose up -d
```

---

## Production Checklist

- [ ] **Environment Variables**
  - [ ] `VITE_API_URL` points to production backend
  - [ ] Backend secrets configured
  - [ ] Database credentials set
  - [ ] CORS properly configured

- [ ] **Security**
  - [ ] HTTPS/SSL certificates installed
  - [ ] Firewall rules configured
  - [ ] Rate limiting enabled
  - [ ] CORS headers properly set
  - [ ] Sensitive data not in logs

- [ ] **Performance**
  - [ ] Frontend assets minified
  - [ ] Browser caching configured
  - [ ] Gzip compression enabled
  - [ ] Database connections pooled
  - [ ] API response caching configured

- [ ] **Monitoring**
  - [ ] Error tracking (Sentry/similar)
  - [ ] Log aggregation setup
  - [ ] Performance monitoring active
  - [ ] Uptime monitoring configured
  - [ ] Alerts configured

- [ ] **Backups**
  - [ ] Database backups automated
  - [ ] Configuration backups stored
  - [ ] Recovery process tested

- [ ] **Documentation**
  - [ ] Deployment procedure documented
  - [ ] Rollback procedure documented
  - [ ] Emergency contacts listed
  - [ ] Runbook created

---

## Monitoring & Logging

### Backend Monitoring

```bash
# View real-time logs
tail -f backend.log

# Monitor resource usage
htop

# Check API status
curl http://localhost:8000/health
```

### Frontend Error Tracking

Consider integrating Sentry:

```bash
npm install @sentry/react
```

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

---

## Scaling

### Load Balancing

Use Nginx as reverse proxy:

```nginx
upstream backend {
    server backend1.example.com:8000;
    server backend2.example.com:8000;
    server backend3.example.com:8000;
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

### Database Optimization

- Add indexes on frequently queried fields
- Enable query caching
- Use connection pooling

### Frontend CDN

Deploy to CDN for better performance:
- Cloudflare
- AWS CloudFront
- Fastly
- Akamai

---

## Troubleshooting

### Backend won't start
```bash
# Check port availability
lsof -i :8000

# Check logs
tail -f backend.log

# Verify dependencies
pip list | grep -i fastapi
```

### Frontend not connecting to backend
```bash
# Check CORS headers
curl -I http://localhost:8000/health

# Verify API URL
echo $VITE_API_URL
```

### Performance issues
```bash
# Monitor resources
top -p $(pgrep -f gunicorn)

# Check database queries
# (enable query logging in your database)

# Profile frontend
# (use Chrome DevTools Performance tab)
```

---

## Rollback Procedure

1. **Identify previous stable version**
2. **Revert code**
   ```bash
   git revert HEAD
   ```
3. **Rebuild and redeploy**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```
4. **Verify functionality**
5. **Monitor logs**

---

## Additional Resources

- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [React Deployment](https://vitejs.dev/guide/static-deploy.html)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

**Questions or issues?** Check the main [README.md](./README.md) or backend/API docs.
