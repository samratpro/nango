# Project Architecture

This is a Django-inspired full-stack framework built with Node.js, TypeScript, Fastify, and Next.js.

## Directory Structure

```
├── api/                    # API Server (Port 8000) - Django's "backend"
│   ├── src/
│   │   ├── apps/          # Django-style apps
│   │   │   └── auth/      # Built-in authentication app
│   │   ├── config/        # Configuration files
│   │   ├── core/          # Core framework code (ORM, fields, etc.)
│   │   ├── cli/           # CLI tools (create user, startapp)
│   │   └── index.ts       # Main API server entry point
│   ├── public/            # Static files
│   └── package.json
│
├── admin/                  # Admin Panel UI (Port 8001) - Django Admin equivalent
│   ├── src/
│   │   ├── app/           # Next.js app directory
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities and helpers
│   └── package.json
│
└── app/                    # Frontend Application (Port 3000) - Your public app
    ├── src/
    │   ├── app/           # Next.js app directory
    │   ├── components/    # React components
    │   └── lib/           # Utilities and helpers
    └── package.json
```

## Port Allocation

**IMPORTANT**: Port 3000 is reserved for your actual frontend application!

- **API Server**: `http://localhost:8000` - Django-style API + Swagger documentation
- **Admin Panel**: `http://localhost:8001` - Django Admin-like interface
- **Frontend App**: `http://localhost:3000` - Your public-facing application (user-designed)

## Component Roles

### 1. API Server (`api/`)

The API server is equivalent to Django's backend. It provides:

- **RESTful API** endpoints
- **Swagger/OpenAPI** documentation at `http://localhost:8000/docs`
- **Django-style ORM** for database operations
- **App-based architecture** - Each feature is a separate "app"
- **Authentication** system with JWT tokens

**Key Files:**
- `api/src/index.ts` - Main server file (like Django's `wsgi.py`)
- `api/src/apps/` - Django-style apps directory
- `api/src/core/` - Framework code (ORM, fields, models)
- `api/src/config/settings.ts` - Configuration (like Django's `settings.py`)

### 2. Admin Panel (`admin/`)

The admin panel is a Next.js application that provides a Django Admin-like interface:

- **CRUD operations** for all registered models
- **User management**
- **Authentication** using the API
- **Table views** with sorting, filtering, and pagination

**Accessing**: `http://localhost:8001`

### 3. Frontend App (`app/`)

This is YOUR application - the public-facing frontend that users will interact with. This is completely separate from the admin panel.

- Build your UI here
- Consumes the API from `http://localhost:8000`
- Runs on port 3000

**Accessing**: `http://localhost:3000`

### 4. CLI Tools (`api/src/cli`)

We provide npm scripts equivalent to Django's `manage.py`:

```bash
# Create a new app
npm run startapp <app_name>

# Run migrations (sync tables)
npm run migrate

# Create a superuser
npm run createsuperuser
```

## Django-Style Apps

Apps are self-contained modules that encapsulate specific functionality.

### Creating a New App

```bash
cd api
npm run startapp blog
```

This creates:

```
api/src/apps/blog/
├── models.ts      # Database models (Django's models.py)
├── routes.ts      # API endpoints (Django's views.py + urls.py)
├── service.ts     # Business logic (optional)
└── index.ts       # App exports
```

### App Structure

**models.ts** - Define your data models:
```typescript
import { Model } from '../../core/model';
import { CharField, TextField, BooleanField, DateTimeField } from '../../core/fields';
import { registerAdmin } from '../../core/adminRegistry';

@registerAdmin({ ... })
export class BlogPost extends Model {
  static getTableName(): string { return 'blog_posts'; }

  title = new CharField({ maxLength: 255 });
  content = new TextField();
  published = new BooleanField({ default: false });
  createdAt = new DateTimeField({ default: () => new Date().toISOString() });
}
```

**routes.ts** - Define your API endpoints:
```typescript
import { FastifyInstance } from 'fastify';
import { BlogPost } from './models';

export default async function blogRoutes(fastify: FastifyInstance) {
  fastify.get('/api/blog', async (request, reply) => {
    const posts = BlogPost.objects.all().all();
    return { posts };
  });
}
```

### Registering an App

1. **Import models** (`api/src/index.ts`):
```typescript
import './apps/blog/models';
```
(This triggers table creation on startup).

2. **Register routes** (`api/src/index.ts`):
```typescript
import blogRoutes from './apps/blog/routes';
await fastify.register(blogRoutes);
```

## Development Workflow

### 1. Create a New Feature

```bash
# Create app
cd api
npm run startapp products

# Edit models in api/src/apps/products/models.ts

# Register in api/src/index.ts
import './apps/products/models';

# Register routes in api/src/index.ts
# Start API server
npm run dev
```

### 2. Build Admin Interface

The admin panel automatically discovers models registered with `@registerAdmin`. Once your API endpoints are set up, you can manage data through the admin panel at `http://localhost:8001`.

### 3. Build Frontend

Your frontend app (`app/`) consumes the API. Build your UI here using Next.js, React, or any frontend framework.

## Database (SQLite)

- **Location**: `api/db.sqlite3`
- **ORM**: Custom Django-style ORM
- **Migrations**: Tables are automatically created/synced on application start (Schema-on-Read approach).

## Authentication

The built-in `auth` app provides:
- User registration
- Email verification
- Login with JWT tokens
- Password reset
- Refresh tokens

**API Endpoints**:
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `POST /auth/refresh` - Refresh access token

## Environment Variables

### API (`.env` in `api/`)
```env
PORT=8000
HOST=0.0.0.0
NODE_ENV=development

# Database
DB_PATH=./db.sqlite3

# Security
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET=your-jwt-secret

# Frontend URLs
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:8001
```

### Admin Panel (`.env` in `admin/`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Running the Project

### Development Mode

```bash
# Terminal 1: API
cd api
npm run dev

# Terminal 2: Admin
cd admin
npm run dev
```

## API Documentation

Swagger documentation is available at: `http://localhost:8000/docs`

## Comparison with Django

| Django | This Framework |
|--------|---------------|
| `manage.py` | `api/src/cli` scripts |
| `python manage.py startapp` | `npm run startapp` |
| `python manage.py migrate` | `npm run migrate` (placeholder for auto-sync) |
| `python manage.py createsuperuser` | `npm run createsuperuser` |
| `python manage.py runserver` | `npm run dev` |
| Django Admin | `admin/` - Next.js app on port 8001 |
| `settings.py` | `api/src/config/settings.ts` |
| `models.py` | `models.ts` in each app |
| `views.py` + `urls.py` | `routes.ts` in each app |
| App structure | Same - `apps/` directory |

## Best Practices

1. **Keep Apps Small**: Each app should focus on a single feature
2. **Use Services**: Put business logic in `service.ts`, keep routes thin
3. **Type Safety**: Leverage TypeScript for type checking
4. **Authentication**: Use the provided JWT auth middleware
5. **Documentation**: Document your API endpoints in Swagger
6. **Port 3000**: Never use port 3000 for API or Admin - it's for your app!

## Security

- JWT tokens for authentication
- CORS configured for frontend and admin
- Environment variables for secrets
- Never commit `.env` files to git
