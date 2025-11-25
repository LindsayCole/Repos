# Database Strategy & Migration Guide

## Current Status: SQLite
You are currently using **SQLite**, which is a file-based database (`dev.db`).

### Is it sufficient?
**No, not for production on Azure.**
*   **Why?** Azure App Services and Container Apps have "ephemeral" file systems. This means every time you deploy a new version or the server restarts, **your database file will be deleted**, and you will lose all data.
*   **Concurrency:** While 5-10 users is low, SQLite can struggle with multiple simultaneous writes, leading to "database locked" errors (which we have already seen during development).

## Recommendation: Azure Database for PostgreSQL
Since you have **Azure Credits**, the best path forward is to use **Azure Database for PostgreSQL - Flexible Server**.

### Why PostgreSQL on Azure?
1.  **Persistence:** Data is stored safely in a managed service, independent of your application code.
2.  **Scalability:** Easily handles 5-10 users or 5,000 users.
3.  **Ecosystem:** Prisma (your ORM) has first-class support for PostgreSQL.
4.  **Cost:** You can use your credits. There is also a "Burstable" tier (B-series) which is very cheap/free for low usage.

## How to Migrate

### 1. Create the Database on Azure
1.  Log in to the **Azure Portal**.
2.  Search for **"Azure Database for PostgreSQL"**.
3.  Create a **Flexible Server**.
4.  Choose a low-cost tier (e.g., **Burstable B1ms**).
5.  Allow access from Azure Services (in Networking settings).
6.  Get your **Connection String**.

### 2. Update Your Code
You need to update `prisma/schema.prisma` to use PostgreSQL instead of SQLite.

**Change this:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**To this:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Update Environment Variables
In your `.env` file (and in your Azure App Service Configuration), update `DATABASE_URL`:

```env
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
DATABASE_URL="postgresql://myadmin:mypassword@my-server.postgres.database.azure.com:5432/performance_db?schema=public&sslmode=require"
```

### 4. Deploy Schema
Once connected, run the migration command to create the tables in the new database:

```bash
npx prisma migrate deploy
```

### 5. Seed Data
Run your seed script to populate the initial data:

```bash
npx prisma db seed
```

## Alternative: Supabase
If you prefer not to manage the database infrastructure on Azure directly, **Supabase** is a fantastic alternative wrapper around PostgreSQL. It offers a very generous free tier. The migration steps (2-5) are exactly the same.
