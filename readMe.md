# AI Database Chatbot

A schema-aware, read-only PostgreSQL chatbot built with Express, LangChain, Groq, and Neon PostgreSQL. It exposes a clean REST API for a future frontend.

## Architecture

```text
POST /api/chat → controller → LangChain planner + schema → SQL validator → PostgreSQL/Neon
                                      ↑                                      ↓
                              concise answer model ← validated result rows
```

The planner sees the current table, column, and relationship map on each request. It returns a structured clarification or a single query. SQL is independently checked, run in a read-only transaction with a timeout and result cap, then only returned rows are supplied to the answer model.

## Setup

1. Create a Neon project and database. In the Neon Console, choose **Connect** and copy the **pooled** connection string (the host contains `-pooler`). If the URL contains `sslmode=require`, it is safe to use; changing it to `sslmode=verify-full` suppresses the current `pg` compatibility warning.
2. Create a Groq API key at [Groq Console](https://console.groq.com/keys). Copy `.env.example` to `.env`; paste the Neon URL as `DATABASE_URL`, leave `DATABASE_SSL=true`, and set `GROQ_API_KEY`. Select an enabled Groq model with `GROQ_MODEL`; `openai/gpt-oss-20b` is the default.
3. Install, create the complete Smart Campus schema, seed it, and start:

```bash
npm install
npm run db:seed
npm start
```

The canonical schema is [prisma/schema.prisma](prisma/schema.prisma) and includes 61 Smart Campus models across academics, attendance, transport, library, fees, notices, hostel, canteen, placements, Wi-Fi, AI, assessments, and security. `npm run db:push` creates or updates these tables without dropping existing data; `npm run db:seed` first applies the schema and then inserts idempotent representative campus data. The legacy `app/db/schema.sql` path is retained only as a pointer to the Prisma schema.

## API

```bash
curl -X POST http://localhost:5000/api/chat -H "Content-Type: application/json" -d "{\"message\":\"Which CSE students have attendance below 75%?\"}"
```

```json
{"success":true,"answer":"...","data":[...],"metadata":{"tablesUsed":["students","departments","attendance"]}}
```

Example questions: “How many students are there?”, “Who teaches Data Structures?”, “What is the average attendance for CSE students?”, “Which teacher teaches the most classes?”, and “Show the top 5 students by attendance.”

## Security

Secrets remain in `.env` and never reach the API. Neon connections are TLS-enabled by default. Helmet, CORS, a request-size limit, and rate limiting protect the HTTP layer. SQL permits one `SELECT` or read-only CTE only; it rejects writes, destructive keywords, system schemas, multi-statements, and `SELECT INTO`. Queries use a PostgreSQL connection pool inside a read-only transaction with a statement timeout and row cap. SQL and model reasoning are not exposed in responses.
