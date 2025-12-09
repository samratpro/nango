# Nango Full-Stack Framework

A powerful **Django-like** framework for Node.js, built with **Fastify** (API) and **Next.js** (Admin Panel).

## 1. Installation

### Setup (First Run)
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/samratpro/nango.git
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

## 4. Documentation & Guides
We have detailed guides for every aspect of the framework:

*   **[Model Registration Guide](./MODEL_REGISTRATION_GUIDE.md)**: How to create models, register them in Admin, and handle relationships.
    *   *Includes: Foreign Keys, Field Types, App Structure.*
*   **[User & Authentication Guide](./USER_AND_AUTH_GUIDE.md)**: Managing users, roles (Teacher/Student), middleware protection, and profiles.
    *   *Includes: Login/Register flows, Email Config, Protected Routes.*
*   **[Django Comparison](./DJANGO_COMPARISON.md)**: A cheat sheet for Django developers moving to this framework.
*   **[Database & Migrations](./DATABASE_MIGRATIONS.md)**: How to handle schema changes (Sync-on-Start vs Manual).
*   **[Production & PostgreSQL](./PRODUCTION_DEPLOYMENT.md)**: Deploying with SQLite or switching to Postgres.
*   **[Rate Limiting](./RATE_LIMITING.md)**: Configuring API request limits.
*   **[Port Configuration](./PORT_CONFIGURATION.md)**: Understanding the 3-port architecture (8000/8001/3000).

---

## 5. Quick Start: Creating a Model

Define models in `src/apps/<appName>/models.ts` with the `@registerAdmin` decorator.

```typescript
import { Model } from '../../core/model';
import { CharField, BooleanField } from '../../core/fields';
import { registerAdmin } from '../../core/adminRegistry';

@registerAdmin({
  appName: 'Blog',
  displayName: 'Posts',
  listDisplay: ['id', 'title', 'isPublished']
})
export class Post extends Model {
  static getTableName() { return 'posts'; }

  title = new CharField({ maxLength: 200 });
  isPublished = new BooleanField({ default: false });
}
```

*For relationships and advanced fields, see the [Model Registration Guide](./MODEL_REGISTRATION_GUIDE.md).*

## 6. Registration
Remember to import your model in `api/src/index.ts` to activate it:
```typescript
import './apps/blog/models';
```

## 7. Routing, Swagger, & API Exposure

### Admin Panel
Models with `@registerAdmin` **automatically appear** in the Admin UI at `http://localhost:8001`.

### Custom API Endpoints
To expose public API endpoints (e.g., for your Frontend App on port 3000):

1.  Create `routes.ts` in your app.
2.  Define Fastify routes.
3.  Add **Swagger Schema** to document them.

```typescript
// api/src/apps/blog/routes.ts
export default async function blogRoutes(fastify: FastifyInstance) {
    fastify.get('/api/posts', {
        schema: { tags: ['Blog'], response: { 200: { type: 'array' } } }
    }, async (req, reply) => {
        return Post.objects.all().all();
    });
}
```

*For full Swagger configuration and Request/Response schemas, see the [User & Auth Guide](./USER_AND_AUTH_GUIDE.md#6-api-documentation-swagger).*

### Swagger UI
Visit `http://localhost:8000/docs` to see your auto-generated API documentation.
*   **Default Login**: `admin` / `admin` (Basic Auth)

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
