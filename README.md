# Couple Space API (NestJS + Prisma + Postgres + MinIO)

A production-oriented Node service implementing the v1 REST API for `auth / users / couples / notes / quests / moments`, with unified response envelope, JWT authentication, cursor pagination, and MinIO presigned image uploads.

## Base URL & Version

- Base URL: `https://{host}:{port}/api/v1`
- Local default: `http://localhost:3000/api/v1`
- OpenAPI docs: `http://localhost:3000/api/docs`

## Global Conventions

### Required Headers

- `Content-Type: application/json`
- `Accept: application/json`
- `Authorization: Bearer <JWT>` (except public endpoints)

### Naming

- Plural resources: `/users`, `/couples`, `/notes`, `/quests`, `/moments`
- Subresource style: `/couples/{coupleId}/notes`

### Time Fields

- Response timestamps use ISO-8601, e.g. `2026-02-24T10:30:00Z`
- Date-only fields (anniversary/date) return `YYYY-MM-DD`

### Unified Response Envelope

Success:

```json
{
  "data": {},
  "meta": { "requestId": "xxx" }
}
```

List success (`nextCursor` included when present):

```json
{
  "data": [],
  "meta": { "requestId": "xxx", "nextCursor": "xxx" }
}
```

Error:

```json
{
  "error": {
    "code": "COUPLE_FULL",
    "message": "Couple space is full",
    "details": {}
  },
  "meta": { "requestId": "xxx" }
}
```

### Status Code Convention

- `200 OK`: read/update success
- `201 Created`: creation success (with `Location`)
- `204 No Content`: deletion success
- `400 Bad Request`: invalid request format
- `401 Unauthorized`: invalid/missing auth
- `403 Forbidden`: no permission
- `404 Not Found`: resource missing
- `409 Conflict`: business conflict (full couple / repeated join)
- `422 Unprocessable Entity`: semantic validation (optional)

## Implemented APIs

### Auth & Users

- `POST /auth/login`
- `GET /users/me`
- `GET /users/{userId}`
- `PATCH /users/{userId}`

### Couples

- `POST /couples`
- `POST /couples/join`
- `GET /couples/{coupleId}`
- `PATCH /couples/{coupleId}`

### Notes

- `GET /couples/{coupleId}/notes`
- `POST /couples/{coupleId}/notes`
- `DELETE /notes/{noteId}`

### Quests

- `GET /couples/{coupleId}/quests`
- `POST /couples/{coupleId}/quests`
- `PATCH /quests/{questId}`
- `POST /quests/{questId}/complete`
- `DELETE /quests/{questId}`

### Moments

- `GET /couples/{coupleId}/moments`
- `POST /couples/{coupleId}/moments`
- `DELETE /moments/{momentId}`

### Media (MinIO)

- `POST /media/presign-upload`

## Error Codes

- Generic: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`
- Business: `PAIR_CODE_NOT_FOUND`, `COUPLE_FULL`, `ALREADY_JOINED`, `INVALID_CURSOR`, `INVALID_CONTENT_TYPE`

## Local Development

## 1) Prerequisites

- Node.js `>= 20.19` (recommended)
- Docker & Docker Compose

## 2) Setup

```bash
cp .env.example .env
npm install
```

## 3) Start infrastructure

```bash
docker compose up -d postgres minio
```

## 4) Run migrations

```bash
npm run prisma:migrate
```

## 5) Start API

```bash
npm run start:dev
```

## 6) Verify

```bash
curl http://localhost:3000/api/v1/health
```

## Docker One-Command Startup

```bash
cp .env.example .env
docker compose up --build
```

The API container runs `prisma migrate deploy` on startup.

## Cursor Pagination

Supported list query params:

- `limit` (default `20`, max `100`)
- `cursor` (base64url encoded `{ createdAt, id }`)
- `sort` (`-createdAt` default; `createdAt` for ascending)

Per-resource filters:

- Notes: `authorId`
- Quests: `status=active|completed`
- Moments: `tag=旅行`

## Security Defaults

- JWT access token auth (public endpoint: `/auth/login`, `/health`)
- Couple membership authorization checks for all couple-owned resources
- MinIO upload uses presigned URL (`image/*` only)

## Deployment Notes

- Set strong `JWT_SECRET`
- Use domain + HTTPS reverse proxy (Nginx recommended)
- Use managed backups for Postgres and MinIO object storage
