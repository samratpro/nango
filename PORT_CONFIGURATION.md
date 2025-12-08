# Port Configuration Guide

## Correct Port Architecture

This framework follows the Django-like architecture with proper port separation:

### 🔌 Port Allocation

| Service | Port | Purpose | URL |
|---------|------|---------|-----|
| **API Server** | **8000** | Backend API + Swagger Documentation | http://localhost:8000 |
| **Admin Panel** | **8001** | Admin UI for managing backend | http://localhost:8001 |
| **Main App** | **3000** | User-facing application (YOUR app) | http://localhost:3000 |

## Important Notes

⚠️ **Port 3000 is RESERVED for your main user application!**

- The admin panel runs on port 8001, NOT 3000
- The API (backend) runs on port 8000
- Port 3000 should be free for developers to build the main user-facing application

## Configuration Files

### API Server (Port 8000)

**File: `api/.env.example`**
```env
PORT=8000
HOST=0.0.0.0

# CORS should include both admin and app
CORS_ORIGIN=http://localhost:8001,http://localhost:3000

# Frontend URLs
ADMIN_URL=http://localhost:8001
FRONTEND_URL=http://localhost:3000
```

**Copy to `.env`:**
```bash
cd api
cp .env.example .env
# Edit .env with your settings
```

### Admin Panel (Port 8001)

**File: `admin/.env.example`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**File: `admin/package.json`**
```json
{
  "scripts": {
    "dev": "next dev -p 8001",
    "start": "next start -p 8001"
  }
}
```

**Copy to `.env`:**
```bash
cd admin
cp .env.example .env
```

### Main App (Port 3000)

**File: `app/.env.example`** (if needed)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**File: `app/package.json`**
```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "start": "next start -p 3000"
  }
}
```

## Running the Services

### Development Mode

```bash
# Terminal 1 - API Server on port 8000
cd api
npm run dev

# Terminal 2 - Admin Panel on port 8001
cd admin
npm run dev

# Terminal 3 - Main App on port 3000 (when you build it)
cd app
npm run dev
```

### Check Services

After starting:
- API: http://localhost:8000/health
- Swagger Docs: http://localhost:8000/docs
- Admin Panel: http://localhost:8001
- Main App: http://localhost:3000

## Accessing Services

### For Developers (Building the Main App)

When building your user-facing application in the `app/` directory:

1. **Use port 3000** (default Next.js port)
2. **API calls** should go to `http://localhost:8000`
3. **Example:**
   ```typescript
   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
   
   // Fetch products
   const response = await fetch(`${API_URL}/api/products`);
   ```

### For Admins (Managing Backend)

When managing users, models, and data:

1. **Access admin panel** at http://localhost:8001
2. **Login** with superuser credentials
3. **Manage:**
   - Users (create Admin/Staff/Regular users)
   - Models (CRUD operations on all registered models)
   - Permissions (assign to staff users)

### For API Documentation

1. **Swagger UI** at http://localhost:8000/docs
2. **Test endpoints** directly in the browser
3. **Authenticate** with JWT tokens

## Production Deployment

In production, you would typically:

1. **API Server**: `api.yourdomain.com` (or keep :8000)
2. **Admin Panel**: `admin.yourdomain.com` (or :8001)
3. **Main App**: `yourdomain.com` (port 80/443)

Update `.env` files accordingly:

```env
# Production API (.env)
PORT=8000
CORS_ORIGIN=https://admin.yourdomain.com,https://yourdomain.com
ADMIN_URL=https://admin.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Production Admin (.env)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Troubleshooting

### Port Already in Use

If you see `EADDRINUSE` error:

**Windows:**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (use PID from above)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9
```

### CORS Issues

If you get CORS errors:

1. Check `api/.env` has correct CORS_ORIGIN
2. Should include: `http://localhost:8001,http://localhost:3000`
3. Restart API server after changing `.env`

### API URL Not Working

If admin panel can't connect to API:

1. Check `admin/.env` has `NEXT_PUBLIC_API_URL=http://localhost:8000`
2. Restart admin panel (Ctrl+C and `npm run dev` again)
3. Check API is actually running on port 8000

## Summary

✅ **API**: Port 8000 (Backend + Swagger)  
✅ **Admin**: Port 8001 (Management UI)  
✅ **App**: Port 3000 (User Application - YOUR CODE)

This separation ensures:
- Backend management doesn't interfere with user application
- Clear separation of concerns
- Port 3000 free for main development
- Professional Django-like architecture
