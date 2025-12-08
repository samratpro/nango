# Nango Full-Stack Framework

A powerful **Django-like** framework for Node.js, built with **Fastify** (API) and **Next.js** (Admin Panel).

## 1. Installation

### Setup (First Run)
1.  **Clone the repository**:
    ```bash
    git clone <repo_url> nango
    cd nango
    ```

2.  **Install API (Backend)**:
    ```bash
    cd api
    npm install
    # (Optional) cp .env.example .env
    ```

3.  **Install Admin (Frontend)**:
    ```bash
    cd ../admin
    npm install
    ```

### Running the servers
You need two terminals open:

*   **Terminal 1 (API - Port 8000)**:
    ```bash
    cd api
    npm run dev
    ```

*   **Terminal 2 (Admin - Port 8001)**:
    ```bash
    cd admin
    npm run dev -p 8001
    ```

## 2. CLI: Creating Users
To create a Superuser (Admin) or Staff user, use the built-in CLI:

```bash
cd api
npm run createsuperuser
```
Follow the interactive prompts:
*   **Role: admin** -> Creates a Superuser (Full access, including Swagger & User Mgmt).
*   **Role: staff** -> Creates a Staff user (Access to Admin Panel, limited permissions).

## 3. CLI: Creating Apps
Create a new modular app with one command:

```bash
cd api
npm run startapp <appName>
```
*Example:* `npm run startapp blog`
This creates `api/src/apps/blog` containing `models.ts` and `index.ts`.

## 4. Creating Models
Define models in `src/apps/<appName>/models.ts`. Use the `@registerAdmin` decorator to expose them to the Admin Panel.

**Example: Creating a 'Post' model with a Foreign Key**

```typescript
import { Model } from '../../core/model';
import { CharField, TextField, BooleanField, DateTimeField, ForeignKey } from '../../core/fields';
import { registerAdmin } from '../../core/adminRegistry';

@registerAdmin({
  appName: 'Blog',
  displayName: 'Posts',
  icon: 'file-text', // Feather icon name
  listDisplay: ['id', 'title', 'author', 'isPublished'],
  searchFields: ['title']
})
export class Post extends Model {
  static getTableName(): string {
    return 'posts';
  }

  // Fields (Property wrappers)
  title = new CharField({ maxLength: 200 });
  content = new TextField();
  
  // Foreign Key to User model (Related by class name string)
  author = new ForeignKey('User', { onDelete: 'CASCADE' });

  isPublished = new BooleanField({ default: false });
  createdAt = new DateTimeField({ default: () => new Date().toISOString() });
}
```

## 5. Registering Apps
After creating an app or model, you **must register it** in the main entry point for it to be loaded.

1.  Open `api/src/index.ts`.
2.  Add an import for your app's models:

```typescript
// ... other imports ...
import './apps/blog/models'; // <-- Register your new app here
```

3.  Restart the API server. The database tables will be automatically created.

## 6. Routing & API Exposure
### Admin Panel
Models with `@registerAdmin` automatically appear in the Admin UI at `http://localhost:8001/dashboard`.

### Swagger / Public API
To expose a custom API endpoint:
1.  Create `routes.ts` in your app folder.
2.  Define routes using Fastify syntax.
3.  Register the routes in `src/index.ts`.

**Example `routes.ts`:**
```typescript
import { FastifyInstance } from 'fastify';
import { Post } from './models';

export default async function blogRoutes(fastify: FastifyInstance) {
    fastify.get('/api/posts', async (req, reply) => {
        return Post.objects.all<{ title: string }>().all();
    });
}
```

**Register in `index.ts`:**
```typescript
import blogRoutes from './apps/blog/routes';
// ...
await fastify.register(blogRoutes);
```

### Swagger Documentation
Visit `http://localhost:8000/docs`.
*   **Access**: Restricted to Superusers only (Basic Auth).
*   Use your Admin credentials to login.

## 7. User Roles & Permissions
*   **Superuser**: Has full access.
*   **Staff**: Can access Admin Panel. Can VIEW/EDIT specific models only if granted permission by a Superuser.
*   **Standard User**: No Admin Panel access.

To use these in your code:
```typescript
import { requireStaff, requireSuperuser } from '../../middleware/auth';

fastify.get('/protected', { preHandler: requireStaff }, async (req, reply) => {
   // Only staff can reach here
});
```

## 8. Service Ports
*   **Port 8000**: API Server (Fastify) & Database.
*   **Port 8001**: Admin Panel (Next.js).
*   **Port 3000**: Your User-Facing Project (Frontend).
