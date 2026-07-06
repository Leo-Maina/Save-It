# Save-It — Student Budgeting Application

Save-It is a web-based budgeting and financial management platform built for
university students, based on the project proposal *"SAVE-IT: A Web-Based
Budget Tracking Application for Financial Planning and Management for
Students"* (Strathmore University, 2026).

All amounts are in **Kenyan Shillings (KSh)**, with no currency conversion.

---

## 1. What's in this build

A complete three-tier application:

- **Frontend** — React (Vite) + Tailwind CSS, React Router, Axios, Recharts
- **Backend** — Node.js + Express, JWT authentication, bcrypt password hashing
- **Database** — MySQL, fully normalised relational schema with sample data

### Implemented features

- Student registration & login (JWT-protected routes)
- Income tracking (allowance, part-time earnings, bursary, other)
- Expense tracking with search, filter by date/category, payment method
- Budgets — monthly, semester, or custom date range — with per-category
  allocations and an **automatic budget suggestion** engine
- Savings goals with contribution history and progress tracking
- Recurring expenses (rent, internet, subscriptions) with due-date reminders
- An alert system (budget thresholds, savings pace, spending trend,
  recurring payments due) that evaluates automatically on relevant actions
  and on a daily scheduled sweep
- Reports: monthly, semester, category analysis, savings performance
  (all stay inside the app — no PDF export, per the brief)
- Admin panel: user management (enable/disable accounts), system
  statistics, category management, activity monitoring
- Dark mode / light mode
- Responsive layout (mobile, tablet, desktop)

### Intentionally stubbed / out of scope for this build

These were called out explicitly in the brief as future-only or as
infrastructure this environment can't provision:

| Feature | Status |
|---|---|
| Email verification | **Stubbed.** Registering returns a verification link directly in the UI (and logs it to the backend console) instead of sending a real email. See `backend/utils/email.js` for where to plug in a real provider (SendGrid, SES, Mailgun, etc.) |
| Google sign-in | **Implemented.** Uses Google Identity Services on the frontend and verifies Google ID tokens in `POST /api/auth/google`. Requires matching Google OAuth client ID values in frontend and backend env files. |
| M-Pesa integration | **Schema only.** The `mpesa_transactions` table exists for future use; no payment logic is implemented, per the brief. |
| PDF export of reports | **Not implemented** — explicitly out of scope per the brief. |
| Bank integration, AI advisor, mobile app | **Not implemented** — explicitly out of scope per the brief. |

---

## 2. Project structure

```
save-it/
├── backend/
│   ├── config/db.js              MySQL connection pool
│   ├── controllers/              Business logic per resource
│   ├── middleware/                Auth (JWT) + validation middleware
│   ├── routes/                    Express route definitions
│   ├── utils/                     JWT, email stub, alert engine, budget suggestions
│   ├── database/
│   │   ├── schema.sql              Full MySQL schema
│   │   └── seed.sql                Sample data (3 users, transactions, budget, goal)
│   ├── server.js                   Entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/             Reusable UI (Card, Button, Modal, ProgressRing, charts…)
    │   ├── context/                 Auth, Theme, Toast providers
    │   ├── pages/                   Route-level pages (auth, student, admin)
    │   ├── services/                Axios client + API service modules
    │   ├── hooks/                   Shared hooks (e.g. useCategories)
    │   └── utils/                   Formatting helpers (KSh, dates)
    ├── .env.example
    └── package.json
```

---

## 3. Prerequisites

- **Node.js** 18+ and npm
- **MySQL** 8.0+ (or MariaDB 10.6+) running locally or accessible remotely

---

## 4. Installation

### 4.1 Database setup

```bash
cd backend/database

# Create the database and all tables
mysql -u root -p < schema.sql

# Load sample data (3 users, transactions, a budget, a savings goal)
mysql -u root -p save_it_db < seed.sql
```

> **Sample login (after seeding):**
> - Student: `leonel.maina@strathmore.edu` / `Password123!`
> - Student: `sandra.mutai@strathmore.edu` / `Password123!`
> - Admin: `admin@saveit.app` / `Password123!`

### 4.2 Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set your MySQL credentials:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=save_it_db
JWT_SECRET=replace_this_with_a_long_random_string
```

Start the backend:

```bash
npm run dev      # with nodemon (auto-restart)
# or
npm start         # plain node
```

The API runs at `http://localhost:5000` by default. Check it's alive:

```bash
curl http://localhost:5000/api/health
# {"status":"ok","service":"save-it-backend"}
```

### 4.3 Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

The default `.env` already points at `http://localhost:5000/api`, which
matches the backend default — no changes needed for local development.

Start the frontend:

```bash
npm run dev
```

Visit `http://localhost:5173`.

---

## 5. Environment variables reference

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Port the API server listens on (default `5000`) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection details |
| `JWT_SECRET` | Secret used to sign JWTs — **change this in production** |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `CLIENT_URL` | Frontend origin, used for CORS |
| `EMAIL_FROM` | From-address used in the stubbed email logger |
| `GOOGLE_CLIENT_ID` | Google OAuth Web Client ID used to verify Google ID tokens |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web Client ID used by `GoogleOAuthProvider` |

---

## 6. Testing instructions

### 6.1 Manual smoke test (recommended first step)

1. Start MySQL, the backend, and the frontend as above.
2. Visit `http://localhost:5173`, click **Get started**, and register a new
   account (any email/password — email verification is stubbed, so you'll
   get a clickable link directly in the UI).
3. Click the verification link, then log in.
4. From the dashboard:
   - Add an income entry (e.g. KSh 15,000, "Allowance")
   - Add an expense (e.g. KSh 1,200, "Food") — confirm the dashboard totals
     and pie chart update
   - Create a budget — try the **Suggest allocations** step and confirm the
     percentages match the brief's example split (Food 30%, Transport 15%,
     Accommodation 20%, Academic 20%, Miscellaneous 15%)
   - Push spending in one category past 80% of its budget allocation, then
     check the notification bell — an alert should appear automatically
   - Create a savings goal and add a contribution; confirm the progress
     ring updates
   - Add a recurring expense with a due date within 2 days, then call
     `POST /api/alerts/refresh` (or wait for the daily 07:00 sweep) and
     confirm a reminder alert appears
5. Log out, log in as `admin@saveit.app`, and confirm:
   - System statistics load on `/admin`
   - You can disable/enable a student account on `/admin/users`
   - You can add a category on `/admin/categories`, and that default
     categories can't be deleted

### 6.2 API testing with curl

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"test@strathmore.edu","password":"TestPass123"}'

# Log in (use the seeded account for a pre-verified login)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"leonel.maina@strathmore.edu","password":"Password123!"}'
# → copy the "token" field from the response

TOKEN="paste-token-here"

# Dashboard
curl http://localhost:5000/api/dashboard -H "Authorization: Bearer $TOKEN"

# Add an expense
curl -X POST http://localhost:5000/api/expenses \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"amount":500,"categoryId":1,"date":"2026-06-15","description":"Lunch","paymentMethod":"cash"}'

# Budget suggestion preview
curl -X POST http://localhost:5000/api/budgets/suggest \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"totalIncome":30000}'
```

### 6.3 What's been verified during development

This build was tested end-to-end in a local MySQL + Node environment before
being handed off, including:

- Schema and seed data load cleanly with no FK or constraint errors
- Registration, login, and JWT-protected routes work correctly
- Role-based access control correctly returns `403` when a student token
  is used against an admin-only route
- Adding an expense that pushes a budget category to/past its allocated
  amount automatically generates a budget alert (verified via direct API
  calls — the math and threshold logic were confirmed against real data)
- Dashboard, budget detail, and category endpoints return data in the
  exact shape the frontend components expect
- The frontend builds cleanly with `npm run build` with no compile errors

Because this was developed in a sandboxed environment, full UI testing
(clicking through every screen in a real browser) and load/performance
testing have **not** been done — please run through section 6.1 yourself
after install, and treat this as a strong starting point rather than a
fully QA'd production deliverable.

---

## 7. Architecture notes

- **Three-tier separation**: React (presentation) → Express REST API
  (business logic) → MySQL (data), matching the brief's architecture.
- **Alerts** are evaluated two ways: synchronously after a relevant write
  (e.g. right after an expense is added, against any budget covering that
  date) and via a daily `node-cron` sweep at 07:00 for recurring-payment
  and spending-trend alerts that aren't tied to a single write.
- **Budget suggestions** are computed by `backend/utils/budgetSuggestions.js`
  using the percentage split given in the brief, and returned as a preview
  the student can edit before the budget is actually created.
- **Passwords** are hashed with `bcryptjs` (pure JS — no native build step
  required, so `npm install` works without compiler toolchains).

---

## 8. Known limitations / next steps

- Email sending, Google OAuth, and M-Pesa are stubbed or schema-only, as
  documented above and in the project's own scope/limitations sections.
- Receipt image upload is supported at the schema and API level
  (`receipt_image` field) but the frontend doesn't yet have a file-upload
  UI for it.
- No automated test suite (unit/integration tests) is included — the
  *"Testing Documentation"* deliverable described in the proposal
  (test cases, results, bug reports, UAT feedback) would need to be
  produced separately based on manual testing against this build.
