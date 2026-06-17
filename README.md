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
- **Coverage:** c8 (Istanbul-compatible LCOV reporter)

---

## 2. Project Structure

```
├── src/
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
│   ├── repository.test.js         # Unit tests — AccountRepo
│   ├── service.test.js            # Unit tests — AccountService
│   ├── transactions.test.js       # Unit tests — Deposit/Withdraw logic
│   ├── transfer.test.js           # Unit tests — Transfer logic
│   ├── controller.test.js         # Unit tests — HTTP routes (mocked)
│   └── integration.test.js        # Integration tests — full API flows
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

### `test/repository.test.js` — AccountRepo Unit Tests
**Tests the data access layer directly (no service, no HTTP).**

| Test | Description |
|------|-------------|
| `should save and retrieve account` | Saves an account to the repo and retrieves it by ID; verifies the name matches. |
| `findAll and delete work` | Creates two accounts, verifies `findAll()` returns at least 2, deletes one, verifies it is gone with `findById()`. |

---

### `test/service.test.js` — AccountService Unit Tests
**Tests the business logic layer with a fresh repo on each test.**

| Test | Description |
|------|-------------|
| `creates account with default balance` | Calls `createAccount({ name: 'Bob' })`; verifies the returned account is truthy and has `balance = 0`. |
| `updates account` | Creates an account, calls `updateAccount()` to change the balance to 50, verifies the new balance. |
| `getAll and delete account` | Creates two accounts, retrieves all (≥2), deletes the first, verifies `getAccount()` returns null. |

---

### `test/transactions.test.js` — Deposit & Withdraw Unit Tests
**Tests the transaction business logic (balance mutation and overdraft guard).**

| Test | Description |
|------|-------------|
| `creates deposit and records transaction` | Creates an account with balance 0, deposits 50, verifies balance becomes 50 and the transaction list has 1 entry of type `deposit`. |
| `prevents overdraft on withdraw` | Creates an account with balance 10, attempts to withdraw 20, expects an error to be thrown (insufficient funds). |

---

### `test/transfer.test.js` — Transfer Unit Tests
**Tests the fund transfer logic between two accounts.**

| Test | Description |
|------|-------------|
| `transfers funds between accounts` | Creates accounts `From` (balance 100) and `To` (balance 10), transfers 30. Verifies `From` = 70, `To` = 40, and the returned object has `type = 'transfer-out'`. |

---

### `test/controller.test.js` — AccountController Route Unit Tests
**Tests HTTP route handlers using mocked service methods (no real database).**

| Test | Description |
|------|-------------|
| `POST / should create account and return 201` | Mocks `createAccount`, sends POST, verifies status 201 and response body. |
| `GET / should return list from service` | Mocks `getAll`, sends GET, verifies status 200 and array response. |
| `GET /:id returns 200 when found and 404 when not` | Mocks `getAccount` with conditional logic; tests both the found (200) and not-found (404) cases. |
| `PUT /:id returns updated object or 400 on error` | Mocks `updateAccount`; verifies 200 on valid payload and 400 on empty payload. |
| `DELETE /:id returns 204 on success and 404 on not found` | Mocks `deleteAccount`; verifies 204 on success and 404 when account doesn't exist. |
| `POST /:id/transactions and GET /:id/transactions` | Mocks `createTransaction` and `listTransactions`; verifies 201 on POST and 200 + array on GET. |

---

### `test/integration.test.js` — Full API Integration Tests
**Tests real HTTP calls through the full stack (auth → account → transactions). No mocking.**

| Test | Description |
|------|-------------|
| `creates and retrieves an account` | Signs up a user, logs in, creates an account via `POST /api/accounts`, then retrieves it via `GET /api/accounts/:id`. Verifies name and ID. |
| `lists all accounts and deletes an account` | Signs up a user, creates 2 accounts, lists them (`GET /api/accounts?owner_id=...`), deletes one (`DELETE /api/accounts/:id`), confirms it is absent from the full list. |
| `performs deposit and lists transactions` | Creates an account, posts a deposit transaction (`POST /api/accounts/:id/transactions`), retrieves transactions, verifies the type is `deposit`. |
| `manager can view all accounts and transactions` | Creates a manager user and a client user with one account. Manager calls `GET /api/accounts` and sees the client's account. Manager also calls `GET /api/accounts/:id/transactions` successfully. |

---

## 6. Code Coverage Table

Generated by **c8** with Vitest. Run `npm run coverage` to regenerate.

| Source File | Lines | Lines Hit | Line % | Branches | Branches Hit | Branch % | Functions | Functions Hit | Function % |
|-------------|-------|-----------|--------|----------|--------------|----------|-----------|---------------|------------|
| `src/server.js` | 24 | 22 | **91.7%** | 2 | 1 | 50.0% | 0 | 0 | — |
| `src/controller/accountController.js` | 84 | 70 | **83.3%** | 24 | 19 | 79.2% | 0 | 0 | — |
| `src/controller/authController.js` | 40 | 35 | **87.5%** | 11 | 6 | 54.5% | 0 | 0 | — |
| `src/middleware/authMiddleware.js` | 18 | 15 | **83.3%** | 6 | 2 | 33.3% | 1 | 1 | **100%** |
| `src/repository/accountRepo.js` | 90 | 88 | **97.8%** | 33 | 29 | 87.9% | 11 | 11 | **100%** |
| `src/repository/userRepo.js` | 56 | 50 | **89.3%** | 13 | 11 | 84.6% | 8 | 6 | **75.0%** |
| `src/service/accountService.js` | 113 | 113 | **100%** | 37 | 18 | 48.6% | 9 | 9 | **100%** |
| `vitest.config.js` | 11 | 11 | **100%** | 1 | 1 | 100% | 1 | 1 | **100%** |

> **Viewing the interactive report:** Open `coverage/index.html` in any browser to see per-file, per-line, and per-branch highlighting.

### Coverage Notes

- **`accountService.js`** achieves 100% line and function coverage — all service methods are exercised.
- **`accountRepo.js`** achieves 97.8% line coverage and 100% function coverage.
- **Branch coverage** is lower in areas like the auth middleware (token parsing) and server startup guard (`require.main === module`) which cannot be triggered during automated tests.
- **`userRepo.js`** `findById` and `findAll` have 0 call hits in the current test suite because they are new additions; consider adding tests for `GET /api/auth/users` and `GET /api/auth/users/:id`.

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
