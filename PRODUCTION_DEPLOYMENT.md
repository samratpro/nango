# Production Deployment & PostgreSQL Guide

## 1. Deploying with SQLite (Recommended default)

This framework comes pre-configured with **SQLite** (`better-sqlite3`). Unlike traditional wisdom, SQLite is often **excellent for production** for many use cases (low to medium traffic, read-heavy sites), thanks to:
*   **WAL Mode**: Write-Ahead Logging is enabled by default, allowing concurrent reads/writes.
*   **Zero Latency**: No network overhead; the DB is just a file.
*   **Simplicity**: No separate DB server to manage.

### Steps for Production (SQLite)
1.  **Server**: Use a VPS (DigitalOcean, Hetzner, AWS EC2). SQLite works best on a persistent filesystem (not suitable for serverless functions like Vercel/AWS Lambda).
2.  **Process Management**: Use `pm2` to run your API.
    ```bash
    npm install -g pm2
    cd api
    npm run build
    pm2 start dist/index.js --name "my-api"
    ```
3.  **Backups**: Simply copy the `db.sqlite3` file. You can use specialized tools like `litestream` for continuous streaming backups to S3.

## 2. Switching to PostgreSQL

If you require horizontal scaling or have high write throughput, you may want to switch to PostgreSQL.

**⚠️ Note**: This framework's core ORM (`src/core/model.ts`) is currently tightly coupled to SQLite syntax (e.g., `?` placeholders) and the `better-sqlite3` driver.

To switch to PostgreSQL, you have two options:

### Option A: Adapter Refactoring (Advanced)
You must modify the core framework files to support Postgres:

1.  **Install Driver**: `npm install pg @types/pg`
2.  **Replace Database Manager**:
    *   Edit `api/src/core/database.ts` to use `pg.Pool` instead of `better-sqlite3`.
    *   Change connection logic to read `POSTGRES_URL` from env.
3.  **Update ORM (`model.ts`)**:
    *   **Placeholders**: Change `?` to `$1`, `$2`, etc. in `buildWhereClause` and `save()` methods.
    *   **ID Retrieval**: SQLite use `lastInsertRowid`. Postgres uses `INSERT ... RETURNING id`. You must update the `save()` method SQL generation.
    *   **Booleans**: Remove manual `1/0` conversion; Postgres supports native `updated = true`.

### Option B: Replace ORM (Recommended for heavy scaling)
If you need full Postgres power, it is easier to replace the custom ORM with **Prisma** or **TypeORM**:

1.  **Install Prisma**: `npm install prisma --save-dev`
2.  **Init**: `npx prisma init`
3.  **Define Schema**: Map your `models.ts` classes to `schema.prisma`.
4.  **Refactor Services**: Replace `User.objects.create(...)` with `prisma.user.create(...)` in your service files.

## 3. Environment Variables for Production

Ensure your `.env` is secure:

```env
NODE_ENV=production
# Update to your production domain
CORS_ORIGIN=https://admin.myapp.com,https://myapp.com
# Use a strong, random string
JWT_SECRET=x8237s..very..long..random..string
```

## 4. Frontend Deployment

*   **Admin Panel (`admin/`)**: Deploy to Vercel, Netlify, or your VPS using `next build`.
*   **User App (`app/`)**: Deploy to Vercel/Netlify.

Remember to set `NEXT_PUBLIC_API_URL` in your frontend build settings to point to your Production API URL (e.g., `https://api.myapp.com`).
