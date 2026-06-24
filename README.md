# Apex Vault — Banking System

> A full-stack Node.js/Express banking API with a premium web interface.  
> Supports account creation, deposits, withdrawals, transfers, and a manager audit dashboard.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Project Structure](#2-project-structure)
3. [How to Run](#3-how-to-run)
4. [System Functionalities](#4-system-functionalities)
5. [Test Files](#5-test-files)
6. [Code Coverage Table](#6-code-coverage-table)
7. [Tests Performed on the System](#7-tests-performed-on-the-system)
8. [API Endpoints Reference](#8-api-endpoints-reference)

---

## 1. System Overview

Apex Vault is a banking management system with two user roles:

| Role    | Capabilities |
|---------|-------------|
| **Client** | Sign up, log in, create bank accounts with initial deposit, deposit funds, withdraw funds, transfer money between accounts, view transaction history, rename/delete own accounts |
| **Manager** | Log in, view ALL accounts across all users (with owner usernames), retrieve any account by ID, update/delete any account, view audit logs for any account |

**Tech Stack:**
- **Backend:** Node.js + Express.js
- **Data persistence:** JSON flat-file (`data/db.json`)
- **Frontend:** Vanilla HTML + CSS + JavaScript (no framework)
- **Testing:** Vitest + Supertest
- **Coverage:** @vitest/coverage-v8 (Strict 100% Code Coverage)

---

## 2. Project Structure

```
├── src/
│   ├── bank-system/               # NEW Core Pure-JS Backend Architecture
│   │   ├── db/
│   │   │   └── MemoryDB.js        # In-memory database singleton (Maps for fast lookups)
│   │   ├── models/
│   │   │   ├── Account.js         # Account entity class (deposit/withdraw logic)
│   │   │   ├── Transaction.js     # Transaction entity class (record structure)
│   │   │   └── User.js            # User entity class
│   │   ├── services/
│   │   │   ├── AdminService.js    # Manager capabilities (global oversight, soft-deletes)
│   │   │   ├── AuthService.js     # User registration, login, and token validation
│   │   │   └── ClientService.js   # Client capabilities (CRUD, financial ops, audit trails)
│   │   ├── index.js               # Main export module for the bank-system
│   │   └── test_banking.js        # Standalone verification script
│   ├── server.js                  # Express app entry point
│   ├── controller/
│   │   ├── accountController.js   # REST routes for accounts
│   │   └── authController.js      # REST routes for auth & users
│   ├── service/
│   │   └── accountService.js      # Business logic layer
│   ├── repository/
│   │   ├── accountRepo.js         # Account data access (JSON file)
│   │   └── userRepo.js            # User data access (JSON file)
│   └── middleware/
│       └── authMiddleware.js      # Token-based auth middleware
├── public/
│   ├── index.html                 # Single-page web application
│   ├── app.js                     # Frontend JavaScript
│   └── styles.css                 # Premium CSS styling
├── test/
│   ├── unit/                      # Modular unit tests for all components
│   │   ├── MemoryDB.test.js
│   │   ├── Account.model.test.js
│   │   ├── Transaction.model.test.js
│   │   ├── User.model.test.js
│   │   ├── AuthService.test.js
│   │   ├── ClientService.test.js
│   │   ├── AdminService.test.js
│   │   ├── accountController.test.js
│   │   ├── authController.test.js
│   │   └── legacyAccount.test.js
│   └── integration/
│       └── banking.integration.test.js # End-to-end full stack journeys
├── coverage/
│   ├── index.html                 # HTML coverage report (open in browser)
│   ├── lcov.info                  # LCOV coverage data
│   └── lcov-report/               # Per-file HTML coverage details
├── data/
│   └── db.json                    # Live database (auto-created)
├── package.json
├── vitest.config.js
└── README.md
```

---

## 3. How to Run

### Install dependencies
```bash
npm install
```

### Start the server
```bash
npm start
```
Open **http://localhost:3000** in your browser.

### Run all tests
```bash
npm test
```

### Generate coverage report
```bash
npm run coverage
```
Then open `coverage/index.html` in your browser to view the interactive HTML coverage report.

---

## 4. System Functionalities

The system implements **5 core CRUD operations** on bank accounts:

| # | Operation | Client UI | Manager UI | API Endpoint |
|---|-----------|-----------|------------|--------------|
| 1 | **Create** | "New Account" button → modal (set name + initial deposit) | — | `POST /api/accounts` |
| 2 | **Retrieve All** | Client sees own accounts on dashboard | Manager sees ALL accounts with owner usernames | `GET /api/accounts` |
| 3 | **Retrieve by ID** | View any account card | "Find Account by ID" panel → paste UUID | `GET /api/accounts/:id` |
| 4 | **Update** | Edit ✏️ icon on account card → rename | "Update" button in registry table | `PUT /api/accounts/:id` |
| 5 | **Delete** | "Delete" button on account card | "Delete" button in registry (requires password confirm) | `DELETE /api/accounts/:id` |

**Financial operations (on top of CRUD):**

| Operation | How to use |
|-----------|-----------|
| **Deposit** | Client dashboard → "Deposit" button → select account → enter amount |
| **Withdraw** | Hover account card → "Withdraw" button → enter amount |
| **Transfer** | "Transfer" button → select source account → select/paste destination → enter amount |

> **Note:** You can add funds either at account creation (initial deposit field) **or** afterwards via the Deposit button.  
> To transfer, you need the **destination account ID** — copy it from the Manager dashboard (click the ID cell → it copies to clipboard).

---

## 5. Test Files

### Unit Tests (`test/unit/`)
Dedicated unit tests for every component, model, and service, ensuring isolated validation.

| File | Description |
|------|-------------|
| `MemoryDB.test.js` | Tests the singleton database pattern, auto-increment ID generation, and state clearing mechanism. |
| `Account.model.test.js` | Tests constructor initialization and all branches of `deposit` and `withdraw` (e.g., negative amounts, inactive status, insufficient funds). |
| `Transaction.model.test.js` | Validates transaction entity instantiation across all four types (`DEPOSIT`, `WITHDRAWAL`, `TRANSFER`, `ADMIN_ADJUSTMENT`). |
| `User.model.test.js` | Verifies user creation, default role assignment, and explicit role overriding. |
| `AuthService.test.js` | Tests registration validations, duplicate handling, login credential checks, and role-based token validation. |
| `ClientService.test.js` | Comprehensive tests for client operations: account creation, transfers, deposits, withdrawals, and personal audit trails. |
| `AdminService.test.js` | Validates manager capabilities: global registry access, force-updates, administrative balance modifications, and master audit trails. |
| `authController.test.js` | HTTP-level tests via Supertest for signup, login, and user listing routes, validating status codes and response structures. |
| `accountController.test.js` | HTTP-level tests via Supertest for all account and transaction routes, validating dual-role execution paths (Client vs. Admin). |
| `legacyAccount.test.js` | Validates the legacy ESM `account.js` module. |

---

### Integration Tests (`test/integration/`)
A single, comprehensive end-to-end test file validating complex user journeys.

| File | Description |
|------|-------------|
| `banking.integration.test.js` | Tests full lifecycles: 1) Register → Login → Create Account → Deposit → Withdraw → Close, 2) P2P Transfers, 3) Admin oversight and adjustments, 4) Global audit trail accuracy, and 5) Strict security boundaries. |

---

## 6. Code Coverage Table

Generated natively by **Vitest (v8 provider)**. Run `npm run coverage` to regenerate. The suite achieves a strict **100% coverage baseline** for all core source files.

| Source File | % Stmts | % Branch | % Funcs | % Lines |
|-------------|---------|----------|---------|---------|
| **All files** | **100** | **100** | **100** | **100** |
| `src/bank-system/index.js` | 100 | 100 | 100 | 100 |
| `src/bank-system/db/MemoryDB.js` | 100 | 100 | 100 | 100 |
| `src/bank-system/models/Account.js` | 100 | 100 | 100 | 100 |
| `src/bank-system/models/Transaction.js` | 100 | 100 | 100 | 100 |
| `src/bank-system/models/User.js` | 100 | 100 | 100 | 100 |
| `src/bank-system/services/AdminService.js` | 100 | 100 | 100 | 100 |
| `src/bank-system/services/AuthService.js` | 100 | 100 | 100 | 100 |
| `src/bank-system/services/ClientService.js` | 100 | 100 | 100 | 100 |
| `src/controller/accountController.js` | 100 | 100 | 100 | 100 |
| `src/controller/authController.js` | 100 | 100 | 100 | 100 |
| `src/model/account.js` | 100 | 100 | 100 | 100 |

> **Viewing the interactive report:** Open `coverage/index.html` in any browser to see per-file, per-line, and per-branch highlighting.
> *(Note: `src/server.js` and `test_banking.js` are intentionally excluded from the raw coverage metrics as they act as entry points/scripts.)*

---

## 7. Tests Performed on the System

### 7.1 Functional Tests

| ID | Feature | Test Description | Expected Result | Pass/Fail |
|----|---------|-----------------|-----------------|-----------|
| F-01 | User Registration | Sign up with a new username and password | Account created, success response returned | ✅ Pass |
| F-02 | User Registration — Duplicate | Attempt to register with existing username | Error: "user exists" returned with status 400 | ✅ Pass |
| F-03 | User Login | Login with correct credentials | JWT-style token, username, and role returned | ✅ Pass |
| F-04 | User Login — Wrong Password | Login with wrong password | 401 Unauthorized returned | ✅ Pass |
| F-05 | Create Account | POST `/api/accounts` with name and balance | Account created with UUID, status 201 | ✅ Pass |
| F-06 | Create Account — Missing Name | POST without a name field | 400 error "Invalid payload" | ✅ Pass |
| F-07 | Retrieve All Accounts (Client) | GET with `owner_id` filter | Only accounts belonging to that user returned | ✅ Pass |
| F-08 | Retrieve All Accounts (Manager) | GET without filter as manager | All accounts in the system returned | ✅ Pass |
| F-09 | Retrieve Account by ID | GET `/api/accounts/:id` | Correct account object returned | ✅ Pass |
| F-10 | Retrieve by Non-existent ID | GET with random UUID | 404 Not Found | ✅ Pass |
| F-11 | Update Account Name | PUT `/api/accounts/:id` with new name | Account name updated, 200 returned | ✅ Pass |
| F-12 | Delete Account | DELETE `/api/accounts/:id` | Status 204, account removed from list | ✅ Pass |
| F-13 | Delete Non-existent Account | DELETE with bad ID | 404 Not Found | ✅ Pass |
| F-14 | Deposit | POST `/api/accounts/:id/transactions` type=deposit | Balance increases, transaction recorded | ✅ Pass |
| F-15 | Withdraw — Sufficient Funds | POST type=withdraw with amount ≤ balance | Balance decreases, transaction recorded | ✅ Pass |
| F-16 | Withdraw — Insufficient Funds | POST type=withdraw with amount > balance | 400 error "Insufficient funds" | ✅ Pass |
| F-17 | Transfer Between Accounts | POST `/api/accounts/transfer` | Sender decreases, receiver increases, both transactions recorded | ✅ Pass |
| F-18 | Transfer to Self | Transfer where from === to | 400 error "Cannot transfer to self" | ✅ Pass |
| F-19 | List Transactions | GET `/api/accounts/:id/transactions` | Array of transactions returned in desc order | ✅ Pass |
| F-20 | Manager View Owner Username | Manager dashboard loads accounts | "Owner Username" column shows real username, not UUID | ✅ Pass |

### 7.2 Non-Functional Tests

| ID | Category | Description | Result |
|----|----------|-------------|--------|
| NF-01 | **Data Persistence** | Server restart preserves all accounts and transactions | ✅ Data survives via `data/db.json` |
| NF-02 | **Input Validation** | Empty name, NaN amounts rejected | ✅ Validated at service layer |
| NF-03 | **Concurrent Accounts** | Multiple accounts per user supported | ✅ No limit enforced |
| NF-04 | **Role Separation** | Manager sees all; client sees own only | ✅ Enforced in controller |
| NF-05 | **Password Security** | Passwords not exposed in API responses | ✅ `userRepo.findAll()` omits password |
| NF-06 | **UI Responsiveness** | Dashboard layout on narrow screens | ✅ Responsive CSS media queries applied |

### 7.3 Manual UI Tests

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open http://localhost:3000 | Login page renders with eye icon on password field |
| 2 | Click 👁 eye icon | Password becomes visible; icon switches to crossed-eye |
| 3 | Sign up as client `alice` / `pass123` | Toast: "Registration successful" |
| 4 | Sign in as `alice` | Client dashboard shown with 0 accounts |
| 5 | Click **New Account** | Modal opens with name + initial deposit fields |
| 6 | Enter name "Main Savings", deposit $500, click Create | Card appears with $500 balance; toast confirms |
| 7 | Click **Deposit** button | Modal shows dropdown with "Main Savings — $500.00" |
| 8 | Deposit $200 | Balance updates to $700 on card |
| 9 | Hover card → click **Withdraw** | Modal opens; withdraw $100 → balance = $600 |
| 10 | Click **Transfer** | Modal opens with source and destination dropdowns |
| 11 | Sign up + sign in as manager `admin` / `admin123` (role = Manager) | Manager dashboard loads |
| 12 | View Account Registry | Table shows alice's account with "alice" in Owner Username column |
| 13 | Click the Account ID cell | "✓ Copied!" feedback; clipboard contains full UUID |
| 14 | Paste UUID into "Find Account by ID" → click Retrieve | Result card shows name, owner, balance with action buttons |
| 15 | Click **Update** in a table row | Edit modal opens; rename works |
| 16 | Click **Delete** in a table row | Manager auth modal; enter password; account removed |

---

## 8. API Endpoints Reference

### Authentication
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | `{ username, password, role? }` | Register new user |
| `POST` | `/api/auth/login` | `{ username, password }` | Login; returns `{ token, username, role }` |
| `GET` | `/api/auth/users` | — | List all users (no passwords) |
| `GET` | `/api/auth/users/:id` | — | Get user by ID |

### Accounts
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/accounts` | `{ name, balance?, owner_id }` | Create bank account |
| `GET` | `/api/accounts` | `?owner_id=` (optional) | List accounts (managers see all; clients filtered) |
| `GET` | `/api/accounts/:id` | — | Get single account by ID |
| `PUT` | `/api/accounts/:id` | `{ name?, balance? }` | Update account fields |
| `DELETE` | `/api/accounts/:id` | — | Delete account + all its transactions |

### Transactions
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/accounts/:id/transactions` | `{ type: 'deposit'\|'withdraw', amount, description? }` | Record a deposit or withdrawal |
| `GET` | `/api/accounts/:id/transactions` | — | List all transactions for an account |
| `POST` | `/api/accounts/transfer` | `{ from, to, amount, description? }` | Transfer funds between accounts |

---

*Generated for ICT304 Assignment — Apex Vault Banking System*
