# How to Register a Model in Django-like Framework

This guide explains how to register a model so it appears in 3 places:
1. **API** - REST endpoints for CRUD operations
2. **Swagger** - Automatic API documentation
3. **Admin UI** - Graphical interface for managing data

## Quick Example

Want to create a `Blog` model that's fully manageable? Follow these steps:

### Step 1: Create the App

```bash
npm run startapp blog
```

This creates:
- `api/src/apps/blog/models.ts`
- `api/src/apps/blog/index.ts`

### Step 2: Customize Your Model

Edit `api/src/apps/blog/models.ts`:

```typescript
import { Model } from '../../core/model';
import { CharField, TextField, BooleanField, DateTimeField } from '../../core/fields';
import { registerAdmin } from '../../core/adminRegistry';

@registerAdmin({
  displayName: 'Blog Posts',       // Name shown in admin
  icon: 'file-text',               // Icon identifier (feather icons)
  permissions: ['view', 'add', 'change', 'delete'],
  listDisplay: ['id', 'title', 'published', 'createdAt'],
  searchFields: ['title', 'content'],
  filterFields: ['published']
})
export class BlogPost extends Model {
  static getTableName(): string {
    return 'blog_posts';
  }

  title = new CharField({ maxLength: 255 });
  slug = new CharField({ maxLength: 255, unique: true });
  content = new TextField();
  published = new BooleanField({ default: false });
  createdAt = new DateTimeField({ default: () => new Date().toISOString() });
}
```

### Step 3: Register the App

Models must be loaded for the database tables to be created.

Open `api/src/index.ts` and add this import:

```typescript
// Import models
import './apps/blog/models';
```


### Step 4: Restart & Test

Restart the API server:
```bash
npm run dev
```
*The `blog_posts` table will be automatically created on startup.*

## Advanced Example: Relationships (Foreign Keys)

Real applications often need relationships. Let's create `Category` and link `BlogPost` to it.

### 1. Define Category Model

Create `api/src/apps/blog/details.ts` (or keep in `models.ts`):

```typescript
// ... imports

@registerAdmin({
  displayName: 'Categories',
  icon: 'tag',
  listDisplay: ['id', 'name', 'slug'],
  searchFields: ['name']
})
export class Category extends Model {
  static getTableName(): string { return 'blog_categories'; }

  name = new CharField({ maxLength: 100 });
  slug = new CharField({ maxLength: 100, unique: true });
}
```

### 2. Update BlogPost with ForeignKey

Update your `BlogPost` class to reference `Category`:

```typescript
import { ForeignKey } from '../../core/fields';
import { Category } from './details'; // Import the model class

@registerAdmin({
  // ... existing config
  listDisplay: ['id', 'title', 'category', 'published'], // Add category to display
  filterFields: ['published', 'category']                // Allow filtering by category
})
export class BlogPost extends Model {
  // ... existing fields

  // Create the relationship
  // 'Category' is the class name or string name of the model
  category = new ForeignKey('Category', { 
    required: true, 
    onDelete: 'CASCADE',  // Deletes posts if category is deleted
    relatedModel: 'Category' // Explicitly state the related admin model name
  });
}
```

### 3. Register Both

In `index.ts`, importing the file containing these classes is enough.

## ✅ That's It!

Your model now appears in **all 3 places**:

### 1. API & Swagger
Visit `http://localhost:8000/docs` (Login as Superuser).
You will see "Blog Posts" if you implement and register routes, or if default CRUD is enabled (future feature).
*Currently, to expose public API endpoints, you must create a `routes.ts` file.*

### 2. Admin UI
Visit `http://localhost:8001/dashboard`.
- **Blog Posts** appears in the sidebar.
- You can fully manage records (Create/Read/Update/Delete).

## Detailed Configuration

### @registerAdmin Decorator Options

```typescript
@registerAdmin({
  displayName: 'Products',        // Display name in admin UI
  icon: 'package',                // Icon for navigation
  permissions: ['view', 'add', 'change', 'delete'], // Allowed operations
  listDisplay: ['id', 'name', 'price'],  // Columns in table
  searchFields: ['name', 'description'], // Searchable fields
  filterFields: ['isActive'],            // Filters
})
```

### Available Field Types

| Field | Example | Description |
|-------|---------|-------------|
| `CharField` | `name = new CharField({ maxLength: 100 })` | Short text (VARCHAR) |
| `TextField` | `content = new TextField()` | Long text |
| `IntegerField` | `age = new IntegerField()` | Integer number |
| `BooleanField` | `isActive = new BooleanField({ default: true })` | Checkbox |
| `DateTimeField` | `createdAt = new DateTimeField()` | Date + Time |
| `EmailField` | `email = new EmailField()` | Validated Email |
| `ForeignKey` | `user = new ForeignKey('User')` | Relationship |

## Creating Routes (Optional)

To expose a custom API for your frontend:

### 1. Create `api/src/apps/blog/routes.ts`:

```typescript
import { FastifyInstance } from 'fastify';
import { BlogPost } from './models';

export default async function blogRoutes(fastify: FastifyInstance) {
    
    // GET /api/posts - List all posts
    fastify.get('/api/posts', {
        schema: {
            tags: ['Blog'], // Group in Swagger UI
            description: 'Get all blog posts',
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            title: { type: 'string' },
                            content: { type: 'string' },
                            published: { type: 'boolean' }
                        }
                    }
                }
            }
        }
    }, async (req, reply) => {
        return BlogPost.objects.all().all();
    });

    // POST /api/posts - Create a post
    fastify.post('/api/posts', {
        schema: {
            tags: ['Blog'],
            body: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    published: { type: 'boolean' }
                }
            }
        }
    }, async (req, reply) => {
        // ... creation logic
    });
}
```

2. Register in `api/src/index.ts`:

```typescript
import blogRoutes from './apps/blog/routes';
// ... inside start() ...
await fastify.register(blogRoutes);
```

## Troubleshooting

### Model doesn't appear in Admin UI
**Check:**
1. Did you `import './apps/appname/models'` in `index.ts`?
2. Did you use `@registerAdmin` on the class?
3. Did you restart the server?

### Database Error: no such table
**Check:**
1. Ensure the model is imported in `index.ts` *before* the server starts.
2. Check console logs for "Database initialized".

## Summary workflow

1. `npm run startapp <name>`
2. Define Model in `models.ts` with `@registerAdmin`.
3. Import in `src/index.ts`.
4. Restart Server.
