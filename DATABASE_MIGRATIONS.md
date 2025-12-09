# Database & Migrations Guide

Because this framework is built for speed and simplicity using SQLite, it handles database schemas differently than Django.

## 1. How Tables are Created (Sync-on-Start)

The framework uses a **Sync-on-Start** approach:

1.  When you run `npm run dev`, the server starts.
2.  It imports all models registered in `api/src/index.ts`.
3.  For each model, it runs `CREATE TABLE IF NOT EXISTS`.

This means **new tables are created automatically** as soon as you define the model and restart the server.

## 2. Handling Schema Changes (Migrations)

⚠️ **Important Difference from Django**:
Currently, the framework **does not** automatically detect changes to existing tables (like adding a new field). `CREATE TABLE IF NOT EXISTS` skips the table if it is already there.

### Scenario A: Development (Resetting Data)
If you are in development and don't care about the data:

1.  Stop the API server.
2.  **Delete** the `api/db.sqlite3` file.
3.  **Restart** the server (`npm run dev`).

*Result*: All tables are recreated with your latest schema (and mostly empty data). The superuser account will need to be recreated (`npm run createsuperuser`).

### Scenario B: Preserving Data (Manual Migration)
If you need to keep your data (or are in production) and want to **add a field**, you must do it manually using SQL.

**Example**: Adding `age` to the `User` table.

1.  Update your Model in `models.ts`:
    ```typescript
    age = new IntegerField({ default: 0 });
    ```

2.  Open your SQLite database (using a tool like *DB Browser for SQLite* or CLI).
3.  Run the SQL command:
    ```sql
    ALTER TABLE users ADD COLUMN age INTEGER DEFAULT 0;
    ```

4.  Restart the server. The Model code will now correctly read/write to that column.

## 3. Database Configuration

The database file location is configured in your `api/.env` file:

```env
# Database Path
DB_PATH=./db.sqlite3
```

You can point this to any absolute or relative path.

## 4. Resetting the Superuser

If you delete your database, you lose your admin account. You can always recreate it:

```bash
cd api
npm run createsuperuser
```

## 5. Summary Check

| Action | How to do it |
|O-------|--------------|
| **Create new model** | Define class -> Import in `index.ts` -> Restart Server. |
| **Add field (Local)** | Delete `db.sqlite3` -> Restart Server. |
| **Add field (Prod)** | Run `ALTER TABLE` SQL command manually. |
| **Rename field** | Manual SQL `ALTER TABLE RENAME COLUMN`. |
