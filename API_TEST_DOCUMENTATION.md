# API Testing Documentation

This document outlines all the manual tests performed on the Banking System API, explaining the purpose and use of each test case. The tests are based on functional and non-functional specifications for the five core system functions.

---

## 1. Create Account (`POST /api/accounts`)

**Purpose:** To verify that the system can successfully create a new bank account with an initial balance and valid currency.

### Test Cases:
*   **Test 1.1: Successful Account Creation (Functional)**
    *   **Description:** Send a POST request with valid data (e.g., `solde`: 1000, `currency`: "USD", `name`: "John Doe").
    *   **Expected Result:** System returns `HTTP 201 Created`. The new account is saved in the database with an auto-generated ID.
    *   **Use:** Ensures the core functionality of opening an account works correctly.

*   **Test 1.2: Missing Required Fields (Functional - Error Handling)**
    *   **Description:** Send a POST request missing required fields like `solde` or `currency`.
    *   **Expected Result:** System returns `HTTP 400 Bad Request`.
    *   **Use:** Validates that the system rejects incomplete data to maintain database integrity and prevent corrupted states.

---

## 2. Get All Accounts (`GET /api/accounts`)

**Purpose:** To verify that the system can retrieve a list of all existing accounts in the database.

### Test Cases:
*   **Test 2.1: Retrieve Account List (Functional)**
    *   **Description:** Send a GET request to `/api/accounts`.
    *   **Expected Result:** System returns `HTTP 200 OK` along with a JSON array containing all accounts.
    *   **Use:** Ensures the application can successfully query the database and return multiple records to the user.

*   **Test 2.2: Retrieve Empty List (Functional)**
    *   **Description:** Send a GET request when no accounts exist in the database.
    *   **Expected Result:** System returns `HTTP 200 OK` with an empty array `[]`.
    *   **Use:** Verifies the system handles empty states gracefully without crashing or throwing server errors.

*   **Test 2.3: Response Time (Non-Functional - Performance)**
    *   **Description:** Measure the time it takes to retrieve the list of accounts.
    *   **Expected Result:** Response should be received within acceptable limits (e.g., < 500ms).
    *   **Use:** Ensures the API remains performant and doesn't degrade user experience, even as the database grows.

---

## 3. Get Account by ID (`GET /api/accounts/{id}`)

**Purpose:** To verify that the system can fetch the details of a specific account using its unique identifier.

### Test Cases:
*   **Test 3.1: Retrieve Existing Account (Functional)**
    *   **Description:** Send a GET request with a valid, existing account ID (e.g., `/api/accounts/1`).
    *   **Expected Result:** System returns `HTTP 200 OK` with the correct account details in JSON format.
    *   **Use:** Validates that individual record retrieval works correctly for fetching specific account details.

*   **Test 3.2: Retrieve Non-Existent Account (Functional - Error Handling)**
    *   **Description:** Send a GET request with an ID that does not exist in the database (e.g., `/api/accounts/999`).
    *   **Expected Result:** System returns `HTTP 404 Not Found`.
    *   **Use:** Ensures the system correctly handles queries for invalid data and informs the user appropriately rather than returning null or failing silently.

---

## 4. Update Account (`PUT /api/accounts/{id}`)

**Purpose:** To verify that the system can update specific information (like the name) of an existing account.

### Test Cases:
*   **Test 4.1: Successful Account Update (Functional)**
    *   **Description:** Send a PUT request to an existing account ID with a new name in the body.
    *   **Expected Result:** System returns `HTTP 200 OK`. The database is updated with the new name.
    *   **Use:** Validates the application's ability to modify existing records, allowing users to correct or update their information.

*   **Test 4.2: Update Non-Existent Account (Functional - Error Handling)**
    *   **Description:** Send a PUT request to an ID that does not exist.
    *   **Expected Result:** System returns `HTTP 404 Not Found`.
    *   **Use:** Prevents the system from attempting to modify records that don't exist and failing unexpectedly.

---

## 5. Delete Account (`DELETE /api/accounts/{id}`)

**Purpose:** To verify that the system can permanently remove an account from the database.

### Test Cases:
*   **Test 5.1: Successful Account Deletion (Functional)**
    *   **Description:** Send a DELETE request with a valid, existing account ID.
    *   **Expected Result:** System returns `HTTP 204 No Content`. Subsequent GET requests for this ID should return `404 Not Found`.
    *   **Use:** Ensures the application can successfully permanently delete records when an account is closed.

*   **Test 5.2: Delete Non-Existent Account (Functional - Error Handling)**
    *   **Description:** Send a DELETE request with an ID that does not exist.
    *   **Expected Result:** System returns `HTTP 404 Not Found`.
    *   **Use:** Verifies the system handles deletion requests for invalid IDs gracefully.

*   **Test 5.3: Idempotency Check (Non-Functional - Reliability)**
    *   **Description:** Send the same DELETE request twice for the same ID.
    *   **Expected Result:** The first request returns `204 No Content`, the second returns `404 Not Found`.
    *   **Use:** Ensures the DELETE operation behaves predictably even if the client accidentally retries the request due to network issues.

---

**Note:** These tests are primarily designed for manual verification using the built-in Swagger UI interface (`/swagger-ui.html`). The expected behaviors and responses correspond directly to the OpenAPI/Swagger annotations defined in the `AccountController`.
