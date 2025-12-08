# Django Comparison

This document shows how our framework compares to Django and how to translate Django concepts.

## Architecture Comparison

| Django | Our Framework |
|--------|---------------|
| `django-admin startproject` | Project structure is pre-created |
| `python manage.py startapp` | `npm run startapp <name>` |
| `python manage.py migrate` | `npm run migrate` |
| `python manage.py createsuperuser` | `npm run createsuperuser` |
| `python manage.py runserver` | `npm run dev` (in api/) |
| `settings.py` | `api/src/config/settings.ts` |
| `urls.py` | Routes in each app's `routes.ts` |
| `models.py` | `models.ts` in each app |
| `views.py` | `routes.ts` (combines routes and views) |
| Django Admin | Next.js Admin Panel |
| Django Templates | Next.js with React |

## Model Definition

### Django
```python
from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'articles'
```

### Our Framework
```typescript
import { Model } from '../../core/model';
import { CharField, TextField, BooleanField, DateTimeField } from '../../core/fields';

export class Article extends Model {
  title = new CharField({ maxLength: 255 });
  content = new TextField();
  published = new BooleanField({ default: false });
  createdAt = new DateTimeField({ default: () => new Date().toISOString() });

  static getTableName(): string {
    return 'articles';
  }
}
```

## ORM Queries

### Django
```python
# Create
article = Article.objects.create(
    title='Hello',
    content='World',
    published=True
)

# Get all
articles = Article.objects.all()

# Filter
articles = Article.objects.filter(published=True)

# Get one
article = Article.objects.get(id=1)

# Update
article.title = 'Updated'
article.save()

# Delete
article.delete()

# Count
count = Article.objects.filter(published=True).count()

# Order by
articles = Article.objects.order_by('-created_at')

# Limit
articles = Article.objects.all()[:10]
```

### Our Framework
```typescript
// Create
const article = Article.objects.create({
  title: 'Hello',
  content: 'World',
  published: true
});

// Get all
const articles = Article.objects.all().all();

// Filter
const articles = Article.objects
  .filter({ published: true })
  .all();

// Get one
const article = Article.objects.get({ id: 1 });

// Update
article.title = 'Updated';
article.save();

// Delete
article.delete();

// Count
const count = Article.objects
  .filter({ published: true })
  .count();

// Order by
const articles = Article.objects
  .all()
  .orderBy('createdAt', 'DESC')
  .all();

// Limit
const articles = Article.objects
  .all()
  .limit(10)
  .all();
```

## Field Types

| Django | Our Framework |
|--------|---------------|
| `AutoField` | `AutoField` |
| `CharField` | `CharField` |
| `TextField` | `TextField` |
| `IntegerField` | `IntegerField` |
| `FloatField` | `FloatField` |
| `BooleanField` | `BooleanField` |
| `DateTimeField` | `DateTimeField` |
| `DateField` | `DateField` |
| `EmailField` | `EmailField` |
| `ForeignKey` | `ForeignKey` |

## Authentication

### Django
```python
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login

# Login
user = authenticate(username='john', password='secret')
if user is not None:
    login(request, user)

# Protected view
@login_required
def protected_view(request):
    return HttpResponse('Hello ' + request.user.username)
```

### Our Framework
```typescript
import { requireAuth } from '../../middleware/auth';

// Login (in routes)
const result = await authService.login({
  email: 'john@example.com',
  password: 'secret'
});

// Protected route
fastify.get('/protected', {
  preHandler: requireAuth
}, async (request, reply) => {
  return { message: 'Hello ' + request.user.username };
});
```

## Settings Configuration

### Django (`settings.py`)
```python
SECRET_KEY = 'your-secret-key'
DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-password'

INSTALLED_APPS = [
    'django.contrib.admin',
    'myapp',
]
```

### Our Framework (`settings.ts`)
```typescript
export const settings: AppSettings = {
  secretKey: process.env.SECRET_KEY || 'your-secret-key',
  environment: 'development',

  database: {
    path: './db.sqlite3'
  },

  email: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-password'
    }
  },

  apps: [
    'auth',
    'myapp',
  ]
};
```

## URL Routing

### Django (`urls.py`)
```python
from django.urls import path
from . import views

urlpatterns = [
    path('articles/', views.article_list),
    path('articles/<int:id>/', views.article_detail),
    path('articles/create/', views.article_create),
]
```

### Our Framework (`routes.ts`)
```typescript
export default async function articleRoutes(fastify: FastifyInstance) {
  fastify.get('/articles', async (request, reply) => {
    // List articles
  });

  fastify.get('/articles/:id', async (request, reply) => {
    // Get article detail
  });

  fastify.post('/articles', async (request, reply) => {
    // Create article
  });
}
```

## Admin Interface

### Django
- Auto-generated admin interface
- Register models in `admin.py`
- Accessible at `/admin`

### Our Framework
- Custom Next.js admin panel
- Built with React and TypeScript
- Protected with JWT authentication
- Accessible at `http://localhost:8001`
- Full control over UI/UX

## Key Improvements Over Django

### 1. Email Verification (Built-in)
Django doesn't include email verification by default. Our framework includes:
- Email verification on registration
- Automatic email sending
- Token-based verification
- Account activation flow

### 2. Swagger Documentation (Built-in)
Django requires Django REST Framework + drf-spectacular. We include:
- Built-in Swagger UI
- Automatic API documentation
- Interactive API testing
- OpenAPI specification

### 3. Modern Frontend
Django uses server-side templates. We provide:
- Next.js 14 with React 18
- TypeScript for type safety
- Modern component architecture
- Separate admin and public frontends

### 4. JWT Authentication
Django uses session-based auth. We provide:
- JWT access tokens
- Refresh token rotation
- Secure token storage
- Modern authentication flow

### 5. TypeScript Throughout
Django uses Python. We provide:
- Full TypeScript support
- Type safety across the stack
- Better IDE support
- Fewer runtime errors

## What Django Has That We Don't (Yet)

1. **Mature ORM**: Django's ORM is more feature-rich
   - Complex queries with Q objects
   - Aggregations
   - Annotations
   - Prefetch/select related

2. **Forms**: Django has built-in form handling
   - We use React Hook Form on the frontend

3. **Middleware**: Django has more middleware options
   - We have basic auth middleware

4. **Third-party Packages**: Django has a huge ecosystem
   - Our framework is new and focused

5. **Database Support**: Django supports multiple databases
   - We currently only support SQLite (can be extended)

## Migration Path from Django

If you're familiar with Django, here's how to think about our framework:

1. **Models** → Same concept, TypeScript syntax
2. **Views** → Combined into route handlers
3. **URLs** → Defined in each app's routes file
4. **Templates** → Next.js React components
5. **Forms** → React Hook Form
6. **Admin** → Custom Next.js admin panel
7. **Migrations** → Simplified, run via CLI
8. **Management Commands** → CLI tool commands

## Best of Both Worlds

Our framework takes inspiration from Django's simplicity while leveraging modern JavaScript/TypeScript tools:

- Django's elegant ORM design
- Django's app-based architecture
- Django's management commands
- Modern TypeScript for type safety
- Fastify for high performance
- Next.js for modern frontends
- Built-in API documentation
- Built-in email verification

This gives you Django's productivity with JavaScript's ecosystem and modern tooling.
