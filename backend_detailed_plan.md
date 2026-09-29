# Chin Chin HRM Backend Detailed Plan

This document outlines the comprehensive plan for migrating the Chin Chin HRM backend from Firebase/Firestore to an ExpressJS + PostgreSQL + Prisma architecture.

## 1. Project Initialization

### 1.1 Tech Stack
- **Runtime**: Node.js (v20+)
- **Language**: TypeScript
- **Framework**: ExpressJS
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Validation**: Zod
- **Auth**: JWT (JSON Web Tokens), bcrypt

### 1.2 Folder Structure (Service/Repository Pattern)
```
chinchin-backend/
├── src/
│   ├── config/           # Environment, DB, and external service configs
│   ├── controllers/      # Route handlers, extracting req/res
│   ├── services/         # Core business logic
│   ├── repositories/     # Data access layer (Prisma wrappers)
│   ├── routes/           # Express route definitions
│   ├── middlewares/      # Auth, error handling, validation
│   ├── schemas/          # Zod validation schemas
│   ├── utils/            # Helper functions, logger
│   ├── types/            # TypeScript type definitions
│   ├── app.ts            # Express app setup
│   └── server.ts         # Entry point (listen)
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # SQL migrations
│   └── seed.ts           # Seeding script
├── package.json
├── tsconfig.json
└── .env
```

### 1.3 Package Dependencies
**Dependencies:**
`express cors helmet morgan dotenv jsonwebtoken bcrypt multer zod prisma @prisma/client date-fns winston`

**Dev Dependencies:**
`typescript @types/node @types/express @types/cors @types/morgan @types/jsonwebtoken @types/bcrypt @types/multer ts-node-dev eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin`

### 1.4 Environment Variables
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/chinchin_db"
JWT_SECRET="super-secret-key-change-in-prod"
JWT_EXPIRES_IN="1d"
UPLOAD_DIR="uploads/"
```

---

## 2. Database Design (PostgreSQL)

### 2.1 ER Diagram

```mermaid
erDiagram
    users ||--o{ time_logs : "has"
    users ||--o{ shifts : "assigned_to"
    users ||--o{ salary_adjustments : "has"
    users ||--o{ payslips : "receives"
    users ||--o{ article_acknowledgements : "acknowledges"
    users ||--o{ schedule_requests : "submits"
    roles ||--o{ users : "has"
    shift_templates ||--o{ shifts : "uses"
    shift_templates ||--o{ shift_requirements : "has"
    handbook_articles ||--o{ article_acknowledgements : "has"

    users {
        uuid id PK
        string name
        string phone UK
        string password_hash
        uuid role_id FK
        string employment_type
        string contract_type
        date onboard_date
        date probation_end_date
        date official_contract_date
        string avatar_url
        decimal base_salary
        boolean is_active
        boolean is_fired
    }

    roles {
        uuid id PK
        string name
    }

    time_logs {
        uuid id PK
        uuid user_id FK
        string log_type
        timestamp timestamp
        string photo_url
    }

    shift_templates {
        uuid id PK
        string name
        time start_time
        time end_time
        int allowed_late_minutes
        boolean is_active
        int order
    }

    shifts {
        uuid id PK
        uuid user_id FK
        uuid template_id FK
        date date
        time start_time
        time end_time
        string status
    }

    shift_requirements {
        uuid id PK
        uuid template_id FK
        int day_of_week
        int required_count
    }

    salary_adjustments {
        uuid id PK
        uuid user_id FK
        string type
        decimal amount
        date date
        text description
    }
    
    schedule_settings {
        uuid id PK
        boolean is_request_reopened
    }

    schedule_requests {
        uuid id PK
        uuid user_id FK
        date week_start
        json requested_shifts
    }

    payslips {
        uuid id PK
        uuid user_id FK
        int month
        int year
        decimal base_salary
        decimal total_hours
        decimal allowances
        decimal punishments
        decimal advances
        decimal final_total
        string status
    }

    punishment_templates {
        uuid id PK
        string name
        decimal amount
        boolean add_to_fund
    }

    fund_logs {
        uuid id PK
        string type
        decimal amount
        text description
        timestamp created_at
    }

    handbook_articles {
        uuid id PK
        string title
        string category
        text content
        string status
        timestamp created_at
        timestamp updated_at
    }

    article_acknowledgements {
        uuid id PK
        uuid article_id FK
        uuid user_id FK
        timestamp acknowledged_at
    }
```

### 2.2 Migration & Seeding Strategy
- **Prisma Migrate**: Use `npx prisma migrate dev` to generate SQL migrations from `schema.prisma`.
- **Seed Strategy**: Create a Node.js script using the Firebase Admin SDK to read all Firestore collections and use Prisma Client to `createMany` records in PostgreSQL. We'll map Firestore document IDs to standard UUIDs or keep them as string PKs during migration if preferred, but generating UUIDs is cleaner.

---

## 3. Authentication & Authorization

### 3.1 Flow
- **Employee/Manager Login**: Submit `phone` and `password` -> verify bcrypt hash -> generate JWT containing `{ userId, roleName, iat, exp }`.
- **Kiosk Clock-in**: Handled without JWT or password. Kiosk frontend fetches the active employee list, user taps profile, system takes photo and sends `POST /clock-in` with `userId` and photo payload.

### 3.2 Middlewares
- `authenticateJWT`: Verifies token from `Authorization: Bearer <token>` header. Injects `req.user`.
- `requireRole(roles[])`: Checks if `req.user.roleName` is in the allowed roles array. Managers have universal access.

---

## 4. API Endpoints Specification

### 4.1 Auth Endpoints
- **POST /api/auth/login**
  - **Auth**: None
  - **Body**: `{ phone: string, password: string }`
  - **Response**: `{ token: string, user: Object }`

### 4.2 User / Employee Endpoints
- **GET /api/users**
  - **Auth**: Manager / Kiosk (limited view for Kiosk)
  - **Response**: List of active employees (or all if specified).
- **POST /api/users**
  - **Auth**: Manager
  - **Body**: Zod schema for new user details. Hashes password default ('chinchinxinhxinh').
- **PUT /api/users/:id**
  - **Auth**: Manager
- **DELETE /api/users/:id** (Soft delete / fire)
  - **Auth**: Manager

### 4.3 Time Log Endpoints
- **POST /api/time-logs/clock-in**
  - **Auth**: None (Kiosk)
  - **Body**: `{ userId, photoBase64 }`
  - **Logic**: Check if last log was IN. If so, fail. Upload photo, save log.
- **POST /api/time-logs/clock-out**
  - **Auth**: None (Kiosk)
- **GET /api/time-logs**
  - **Auth**: Manager / Employee (self only)
  - **Query**: `startDate`, `endDate`, `userId`

### 4.4 Shift & Template Endpoints
- **GET /api/shift-templates** (Auth: Any)
- **GET /api/shifts** (Auth: Manager / Employee)
  - Query filters for date range and userId.
- **POST /api/shifts/register** (Auth: Employee)
  - Employee submits their desired shifts.
- **PUT /api/shifts/:id/publish** (Auth: Manager)
  - Updates shift status to `published`.

### 4.5 Payroll Endpoints
- **GET /api/payroll/calculate**
  - **Auth**: Manager
  - **Query**: `month`, `year`, `userId`
  - **Logic**: Aggregates time logs, computes hours/days based on employment type. Applies base salary. Sums `salary_adjustments` (allowances, punishments, advances).
- **POST /api/payroll/payslips** (Auth: Manager)
  - Saves a snapshot of the calculated payroll.
- **POST /api/salary-adjustments** (Auth: Manager)

### 4.6 Handbook & Acknowledgements
- **GET /api/handbook**
- **POST /api/handbook** (Manager)
- **POST /api/handbook/:id/acknowledge** (Employee)

### 4.7 Punishments & Funds
- **GET /api/punishments/templates**
- **GET /api/funds/logs**
- **POST /api/funds/logs** (Manager)

---

## 5. Business Logic Services

- **AuthService**: Handles bcrypt hashing, JWT signing/verification.
- **AttendanceService**: 
  - `clockIn(userId, photo)`: Validates that the employee isn't already clocked in. Processes photo upload.
  - `clockOut(userId, photo)`: Reverses above.
- **ShiftService**:
  - `registerShifts(userId, shifts)`: Validates against `schedule_settings` window. Checks `shift_requirements` to warn about overstaffing.
- **PayrollService**:
  - `calculateMonthly(userId, month, year)`:
    1. Fetch `users` base salary and contract type.
    2. Fetch `time_logs` and published `shifts` for the month.
    3. Calculate total worked hours (for Part-time) or days (Full-time).
    4. Fetch `salary_adjustments` for the month.
    5. Final Salary = (Base * Hours/Days) + Allowances - Punishments - Advances.

---

## 6. File Upload & Storage

- **Storage**: Local filesystem initially (`/uploads`), organized as:
  - `/uploads/avatars/`
  - `/uploads/timelogs/`
  - `/uploads/handbook/`
- **Multer**: Use `multer` to handle `multipart/form-data`.
- **Photo processing**: Can use `sharp` to resize Kiosk photos to save disk space.
- **Static serving**: Express `express.static('uploads')`.

---

## 7. Error Handling

- **AppError Class**: Custom class extending Error with `statusCode` and `isOperational`.
- **Global Error Middleware**: Catches all errors. Distinguishes between Zod Validation errors (400), AppErrors (custom), and unknown server errors (500). Formats response uniformly: `{ success: false, message: string, errors?: [] }`.

---

## 8. Data Migration Script (Firestore to PG)

- Create a standalone Node script using `firebase-admin` and `@prisma/client`.
- Flow:
  1. Read `roles`, insert into PG.
  2. Read `employees`, map to `users`, insert.
  3. Read `shiftTemplates`, insert.
  4. Read `timeLogs`, map IDs, insert.
  5. Repeat for all collections.
- Important: Format Firestore Timestamps to JS Dates before Prisma insertion.

---

## 9. Deployment Strategy

- **Target**: VPS (e.g., DigitalOcean Droplet, Ubuntu).
- **Process Manager**: PM2 to keep the Node process alive and handle clustering.
- **Reverse Proxy**: Nginx to route port 80/443 to Node port 3000.
- **Database**: Run PostgreSQL via Docker on the VPS, or use a managed DB service.
- **CI/CD**: GitHub Actions to run tests, build TS, and SCP/SSH deploy to the VPS on push to `main`.

---

## 10. Git Repository Setup

- **Name**: `chinchin-backend`
- **Branching**: `main` for production, `dev` for active development, feature branches (`feat/auth`, `feat/payroll`).
- **Initial Commit**: Project skeleton, TS config, Prisma schema.

---

## 11. Step-by-Step Execution Order

1. **Setup Project** (1 hour): `npm init`, install dependencies, setup TS, ESLint, Express skeleton.
2. **Database Modeling** (2 hours): Write `schema.prisma`, run initial migration, setup Seed script.
3. **Core Middlewares & Utilities** (1 hour): Error handler, JWT utils, Zod validator middleware.
4. **Auth & Users Feature** (2 hours): Routes, Controllers, Services for login and user CRUD.
5. **Time Tracking Feature** (2 hours): Multer setup, clock in/out endpoints.
6. **Shift Management** (3 hours): Templates, requirements, schedule requests, publishing logic.
7. **Payroll Feature** (3 hours): Complex calculation logic, payslip generation, adjustments.
8. **Handbook & Funds** (2 hours): CMS endpoints, acknowledgements, fund logging.
9. **Migration Script** (3 hours): Write and test the Firestore exporter and PG importer.
10. **Testing & QA** (4 hours): API testing via Postman/Insomnia.
11. **Deployment Setup** (2 hours): Docker/Nginx/PM2 config.
