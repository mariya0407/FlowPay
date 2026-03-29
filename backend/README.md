# Reimbursement Management Backend API

This backend provides a robust Next.js API layer powered by Prisma and PostgreSQL for the FlowPay / Reimbursement Management System. It supports multi-tenancy, hierarchical roles, dynamic sequential approval routing, and OCR + multi-currency features natively.

## Setup Instructions
1. Clone the project and run `npm install`.
2. Ensure you have your `.env` configured with the correct `DATABASE_URL` and `JWT_SECRET`.
3. Sync the database: `npx prisma migrate dev`.
4. Run the seed script to populate test data: `npx prisma db seed`.
5. Start the development server (if running a Next.js environment): `npm run dev`.

---

## API Endpoints Overview

⚠️ **Authentication Requirement:** All endpoints (except Login & Register) require the JWT token to be passed in the `Authorization` header as a Bearer token:
`Authorization: Bearer <YOUR_JWT_TOKEN>`

### 1. Identity & Access Management (IAM)

#### `POST /api/auth/register` (Public)
Creates a completely new Company tenant and its root Admin User.
- **Body:** `{ "companyName": "Acme", "userName": "Admin", "email": "admin@acme.com", "password": "password123", "baseCurrency": "USD" }`

#### `POST /api/auth/login` (Public)
Authenticates a user and generates the JWT.
- **Body:** `{ "email": "admin@acme.com", "password": "password123" }`
- **Response:** `{ "token": "ey...", "user": { "role": "Admin", "companyId": 1 ... } }`

#### `POST /api/users` (Admin Only)
Creates an Employee or Manager within the Admin's Company.
- **Body:** `{ "name": "Bob", "email": "bob@acme.com", "password": "password123", "role": "Employee", "managerId": 2 }`

#### `GET /api/users` (Admin Only)
Retrieves the roster for the company. Supports `?role=Manager`.

---

### 2. Core Domain Logistics

#### `POST /api/categories` (Admin Only)
Registers a new type of expense for the company (e.g., Travel, Software).
- **Body:** `{ "name": "Travel", "description": "Flights and Hotels" }`

#### `GET /api/categories` (Authenticated)
Retrieves all usable expense categories for the company.

---

### 3. Expense Submissions

#### `POST /api/expenses` (Employee / Authenticated)
Submits a new Expense. Real-time dynamic Exchange Rates are pulled automatically if `currency` differs from the Company `baseCurrency`. The Approval Workflow chain is generated sequentially instantly across the `ExpenseApproval` table based on the rule configuration.
- **Body:** 
  ```json
  {
    "name": "Trip to NY",
    "merchant": "Delta Airlines",
    "categoryId": 1,
    "amount": 400.00,
    "currency": "USD",
    "description": "Flight for conference",
    "expenseDate": "2026-03-29",
    "ocrData": { "fileUrl": "https://s3.url", "rawJson": { "Confidence": 98 } }
  }
  ```

#### `GET /api/expenses` (Employee / Authenticated)
Returns all active expenses submitted by the current user, alongside their receipt artifacts and overarching category identifiers.

---

### 4. The Complex Approval Workflow

#### `POST /api/rules` (Admin Only)
Defines the sequential criteria required to get an expense "Approved".
- **Body Example:** 
  ```json
  {
    "name": "Strict Budget Rule",
    "isManagerApproval": true,
    "specialApproverId": 1, 
    "approvers": [
      { "approverId": 3, "stepOrder": 2 }
    ]
  }
  ```

#### `POST /api/expenses/:id/approve` (Approvers / Managers / Admins overriders)
Permits an assigned Approver to clear or reject a pending step in the Sequential Workflow.
- **Body:** `{ "action": "Approve", "comments": "Approved per budget limit." }`
- **Logic:** You cannot approve out of sequence (E.g. Step 3 cannot approve if Step 2 is pending) unless you hold an `Admin` bypass role. Rejections kill the entire parent expense cascade immediately. Approving the *final* step sequentially will flip the actual `Expense` to `Approved`. Fully documented via `AuditLog`.
