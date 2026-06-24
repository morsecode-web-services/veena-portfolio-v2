# ⚡ Local Supabase Quick Links & CLI Guide

This document contains all local Supabase URLs, keys, database connection strings, and common commands for managing your local Supabase environment.

---

## 🛠️ Prerequisites

- **Docker Desktop**: Since local Supabase runs inside Docker containers, Docker Desktop must be running before you execute any Supabase CLI commands.

---

## 🔗 Local Services & URLs

When Supabase is running locally, the following services are available:

| Service | URL / Port | Description |
| :--- | :--- | :--- |
| **Supabase Studio (Dashboard)** | [http://127.0.0.1:54323](http://127.0.0.1:54323) | The local web interface to manage database tables, SQL queries, auth users, and storage. |
| **Kong API Gateway (Public URL)** | [http://127.0.0.1:54321](http://127.0.0.1:54321) | The main entry point. Maps to `NEXT_PUBLIC_SUPABASE_URL`. |
| **Inbucket / Mailpit (Email Dev)** | [http://127.0.0.1:54324](http://127.0.0.1:54324) | Local SMTP server interface. Intercepts all emails sent by Supabase Auth for local testing. |
| **REST API** | [http://127.0.0.1:54321/rest/v1](http://127.0.0.1:54321/rest/v1) | REST API endpoint for database queries. |
| **GraphQL API** | [http://127.0.0.1:54321/graphql/v1](http://127.0.0.1:54321/graphql/v1) | GraphQL endpoint. |
| **S3 Storage / API** | [http://127.0.0.1:54321/storage/v1/s3](http://127.0.0.1:54321/storage/v1/s3) | S3-compatible object storage endpoint. |

---

## 🔑 Environment Keys (Local)

These are configured in your [.env.local](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/.env.local) file for local development:

- **NEXT_PUBLIC_SUPABASE_URL**: `http://127.0.0.1:54321`
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: 
  ```text
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
  ```
- **SUPABASE_SERVICE_ROLE_KEY**:
  ```text
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
  ```

> [!WARNING]
> These keys are meant **ONLY** for local development. Never commit these keys into public configuration or production env vars.

---

## 🗄️ Database Connection Details

Use these details to connect DBeaver, pgAdmin, VS Code extensions, or direct scripts to your local database:

- **Host**: `127.0.0.1`
- **Port**: `54322`
- **Database Name**: `postgres`
- **Username**: `postgres`
- **Password**: `postgres`
- **Connection URI**: 
  ```text
  postgresql://postgres:postgres@127.0.0.1:54322/postgres
  ```

---

## 💻 CLI Commands (Local Management)

Since Supabase is managed via CLI, run the following commands in the root of your project:

### Start Supabase
Starts all the Supabase Docker containers.
```bash
npx supabase start
```

### Stop Supabase
Stops all the containers without destroying database data.
```bash
npx supabase stop
```

### Check Current Status
Prints out all active service ports, URLs, and keys.
```bash
npx supabase status
```

### Restart Supabase
```bash
npx supabase stop && npx supabase start
```

### Reset Database
Re-applies all SQL migrations and seed data from scratch. **This is destructive** to any manually added database contents.
```bash
npx supabase db reset
```

### Create a New Migration File
Creates a new boilerplate file under `supabase/migrations` to write schema updates.
```bash
npx supabase migration new <migration_name>
```

### Generate TypeScript Types
Generates strongly-typed TS definitions matching your local database schema.
```bash
npx supabase gen types typescript --local > types/supabase.ts
```

---

## 💡 Troubleshooting Tips

- **Docker not running**: If you see `Docker daemon is not running`, open Docker Desktop and wait for the green indicator in the bottom-left corner.
- **Port Conflict**: If port `54321`, `54322`, `54323`, or `54324` is in use, make sure you don't have another local Supabase project running or a standard Postgres server running on port `54322`.
- **Database Reset fails**: If migration scripts fail, run `npx supabase db reset` to start fresh from migrations.
