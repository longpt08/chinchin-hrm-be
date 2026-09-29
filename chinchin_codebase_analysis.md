# Chin Chin HRM Codebase Analysis

## PART 1: BUSINESS LOGIC & DATA ANALYSIS

### 1.1 Business Domains & Features
The Chin Chin HRM is a comprehensive Human Resource Management SPA built for a coffee shop/business. Key features include:

- **Authentication & Access Control**: 
  - Kiosk-based check-in/out without passwords (tap profile and take photo).
  - PIN/Password based access for Employee Portal and Manager Dashboard.
  - Role-based views: Manager has full access, Employee can only see their own schedule, timesheets, payslips, and handbook.
  - Auto-logout mechanism (15 minutes of inactivity).

- **Employee Management**:
  - Tracks personal info, roles (Full-time/Part-time), contract status (Probation/Official), and dates (Onboard, Probation End, Official Contract).
  - Salary history tracking for Official employees and fixed probation salary for Probation employees.
  - Soft-delete functionality (Firing employees) rather than hard deletion.

- **Attendance & Time Tracking**:
  - Employees Clock In/Out via the Kiosk View.
  - Records timestamp and an optional webcam photo for verification.
  - Generates 'IN' and 'OUT' records which are used to calculate total worked hours/days.

- **Shift Management & Scheduling**:
  - **Shift Templates**: Predefined shifts (e.g., Morning, Afternoon) with start/end times and allowed late minutes.
  - **Shift Requirements**: Configuration to specify the required number of employees for each shift on each day of the week.
  - **Schedule Requests**: Employees submit availability (custom or template shifts) for the upcoming week on designated days (Thursdays/Fridays).
  - **Roster & Publishing**: Managers review requested shifts and "publish" them to make them official. Overstaffing warnings prevent assigning too many employees to one shift.

- **Salary & Payroll**:
  - Calculates Final Salary = Base Salary + Allowances - Punishments - Advances.
  - Maintains a "Salary Fund" history tracking additions (punishments that add to fund) and deductions.
  - Generates Payslips monthly, capturing snapshots of hours, allowances, deductions, and base salary.
  - Tracks adjustments through `salaryAdjustments` (allowances, punishments, advances).

- **Handbook CMS**:
  - Markdown-based content management system for store policies, recipes, and guidance.
  - Target roles can be specified so only relevant employees see certain articles.
  - Employees must read and "Acknowledge" articles.

- **Punishment System**:
  - Predefined punishment templates.
  - Punishments can optionally contribute to the communal "Salary Fund".
  - Specific features for automatically or manually punishing late shifts.

### 1.2 Data Flow Diagrams
**Clock In/Out Flow:**
`Employee taps profile (Kiosk)` -> `Webcam captures photo` -> `Firestore timeLogs (Type: IN/OUT, timestamp, photo)` -> `Dashboard recalculates employee status in real-time`.

**Schedule Submission Flow:**
`Employee opens Portal` -> `Selects available shifts for next week` -> `Validates against ShiftRequirements (overstaff warning)` -> `Saves to Firestore (Shifts, status: 'registered')` -> `Manager reviews in Dashboard` -> `Manager clicks to approve` -> `Firestore update (status: 'published')`.

**Payroll Calculation Flow:**
`System aggregates timeLogs for the month` -> `Matches with published Shifts` -> `Calculates total hours (Part-time) or days (Full-time)` -> `Applies base rate/salary` -> `Fetches salaryAdjustments for the month` -> `Calculates Final Total` -> `Manager generates Payslip` -> `Saved to Firestore (payslips)`.

### 1.3 Firestore Collections & Relationships
- `employees`: `{ name, roleId, role, type, contractType, onboardDate, probationEndDate, officialContractDate, avatar, qrImage, probationSalary, salaryHistory, phone, password, isFired }`
- `timeLogs`: `{ employeeId, type ('IN'|'OUT'), timestamp, photo }`
- `shifts`: `{ employeeId/employeeIds, date, startTime, endTime, templateId, status ('registered'|'published') }`
- `shiftTemplates`: `{ name, startTime, endTime, allowedLateMinutes, isActive, order }`
- `roles`: `{ name }`
- `salaryAdjustments`: `{ employeeId, type, amount, date, description }`
- `shiftRequirements`: Document ID is `templateId`. Fields represent days of week and required count.
- `punishmentTemplates`: `{ name, amount, addToFund }`
- `scheduleRequests`: `{ employeeId, weekStart, requestedShifts }`
- `payslips`: `{ employeeId, month, year, baseSalary, totalHours, allowances, punishments, advances, finalTotal, status }`
- `settings`: (Document `schedule`) Configures submission window rules.
- `handbookArticles`: `{ title, category, targetRoles, content, status, acknowledgedBy: [employeeIds], createdAt, updatedAt }`
- `fundLogs`: `{ type, amount, description, createdAt }`

## PART 2: FRONTEND DOCUMENTATION

### 2.1 Component Tree & Hierarchy
- `App` (Context Provider: `HRMProvider`)
  - `AppContent` (Handles auto-logout listener and conditional rendering of views)
    - `KioskView` (Pages)
      - `DigitalClock`
      - `WebcamCapture`
    - `ManagerLogin` (Pages)
    - `EmployeeLogin` (Pages)
    - `ManagerDashboard` (Pages)
      - `SalaryTab`
      - `HandbookCMS`
      - UI Components (`Modal`, `LanguageSwitcher`, `MonthYearPicker`)
    - `EmployeeDashboard` (Pages)
      - `EmployeeHandbook`
      - UI Components (`Modal`, `LanguageSwitcher`)

### 2.2 State Management & Routing
- **Routing**: Handled manually via React Context `currentView` state. No `react-router` used. Views include `kiosk`, `manager_login`, `manager_dashboard`, `employee_login`, `employee_dashboard`.
- **State**: The `HRMContext` (`src/context/HRMContext.jsx`) is the central brain. It subscribes to all Firestore collections in real-time (using `onSnapshot`) and exposes the raw arrays (e.g., `employees`, `shifts`, `timeLogs`) to all components. It also exports functions to mutate data (`addEmployee`, `clockIn`, etc.).
- **Local Storage**: `sessionExpiry` used to track inactivity.
- **i18n**: Handled via `react-i18next` with locales (English, Vietnamese).

### 2.3 Design System
**Color Palette:**
- Background: Cream `#F9F6F0`
- Surface: White `#FFFFFF` (Translucent: `rgba(255, 255, 255, 0.7)`)
- Primary: Cappuccino `#5C4033` (Hover: `#4A3329`)
- Secondary: Latte/Beige `#C89F7A`
- Text Main: Dark Espresso `#2C2118`
- Text Muted: `#7E6C5F`
- Border: `#E8E0D5`
- Success: `#6B8E23` (BG: `#E8F5E9`)
- Danger: `#D32F2F` (BG: `#FFEBEE`)

**Typography:**
- `var(--font-sans)`: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

**Spacing & Radius:**
- Shadows: Soft `0 4px 20px rgba(92,64,51,0.08)`, Medium `0 8px 30px rgba(92,64,51,0.12)`
- Radius: sm `8px`, md `16px`, lg `24px`, full `9999px`

**UI Patterns:**
- **Glassmorphism**: `.glass` class used for cards/modals.
- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-ghost`, `.btn-huge`. Pill-shaped by default (`--radius-full`).
- **Icons**: Lucide React is used pervasively.
- **Modals**: Reusable `<Modal>` component with backdrop blur.

## PART 3: BACKEND DOCUMENTATION (For BE Agent)

### 3.1 Proposed SQL Schema Mapping
**Table: `users` (Combines roles, extends employee)**
- `id` (UUID, PK)
- `name` (VARCHAR)
- `phone` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `role_id` (UUID, FK to roles)
- `employment_type` (ENUM: Full-time, Part-time)
- `contract_type` (ENUM: Probation, Official)
- `onboard_date` (DATE)
- `probation_end_date` (DATE)
- `official_contract_date` (DATE)
- `avatar_url` (VARCHAR)
- `base_salary` (DECIMAL)
- `is_active` (BOOLEAN, defaults TRUE)

**Table: `roles`**
- `id` (UUID, PK)
- `name` (VARCHAR)

**Table: `time_logs`**
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `log_type` (ENUM: IN, OUT)
- `timestamp` (TIMESTAMPTZ)
- `photo_url` (VARCHAR)

**Table: `shift_templates`**
- `id` (UUID, PK)
- `name` (VARCHAR)
- `start_time` (TIME)
- `end_time` (TIME)
- `allowed_late_minutes` (INT)
- `is_active` (BOOLEAN)

**Table: `shifts`**
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `template_id` (UUID, FK, Nullable)
- `date` (DATE)
- `start_time` (TIME)
- `end_time` (TIME)
- `status` (ENUM: registered, published)

**Table: `salary_adjustments`**
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `type` (ENUM: allowance, punishment, advance)
- `amount` (DECIMAL)
- `date` (DATE)
- `description` (TEXT)

**Table: `payslips`**
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `month` (INT)
- `year` (INT)
- `base_salary` (DECIMAL)
- `total_hours` (DECIMAL)
- `allowances` (DECIMAL)
- `punishments` (DECIMAL)
- `advances` (DECIMAL)
- `final_total` (DECIMAL)
- `status` (VARCHAR)

**Table: `handbook_articles`**
- `id` (UUID, PK)
- `title` (VARCHAR)
- `category` (VARCHAR)
- `content` (TEXT)
- `status` (VARCHAR)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Table: `article_acknowledgements`**
- `article_id` (UUID, FK)
- `user_id` (UUID, FK)
- `acknowledged_at` (TIMESTAMPTZ)

### 3.2 API Endpoints Needed
1. **Auth**
   - `POST /api/auth/login` (Body: phone, password) -> JWT
2. **Users/Employees**
   - `GET /api/users` (Roles: Manager)
   - `POST /api/users` (Roles: Manager)
   - `PUT /api/users/:id` (Roles: Manager)
3. **Time Tracking**
   - `POST /api/time-logs/clock-in` (Body: userId, photo)
   - `POST /api/time-logs/clock-out` (Body: userId, photo)
   - `GET /api/time-logs` (Query: date range)
4. **Shifts**
   - `GET /api/shifts` (Query: date range, userId)
   - `POST /api/shifts/register` (Body: userId, shifts[]) (Roles: Employee)
   - `PUT /api/shifts/:id/publish` (Roles: Manager)
5. **Payroll**
   - `GET /api/payroll/calculate` (Query: month, year, userId)
   - `POST /api/payroll/payslips` (Roles: Manager)
   - `POST /api/payroll/adjustments` (Roles: Manager)
6. **Handbook**
   - `GET /api/handbook`
   - `POST /api/handbook` (Roles: Manager)
   - `POST /api/handbook/:id/acknowledge` (Roles: Employee)

### 3.3 File Storage Requirements
- **Webcam Photos**: Uploaded during clock-in/out to verify employee identity. Requires short-term or compressed storage.
- **Avatars**: Employee profile pictures.
- **Handbook Assets**: Images uploaded inside handbook articles.
- Recommend using AWS S3 / Cloud Storage buckets separated into `/avatars`, `/timelogs`, and `/handbook` paths.

### 3.4 Validation Rules
- `Employee`: Phone number must be unique. Password defaults to `chinchinxinhxinh` if not provided.
- `TimeLogs`: Cannot clock in if already clocked in. Cannot clock out if not clocked in.
- `Shifts`: Submission window restricted to Thursday and Friday (enforced by `settings`).
- `Payslip`: Total must match (Base + Allowances) - (Punishments + Advances).
