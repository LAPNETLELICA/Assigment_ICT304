# Functionalities (JavaScript implementation)

1. Create a New Account
   - Controller: `src/controller/accountController.js` — `POST /api/accounts`
   - Service: `src/service/accountService.js` — `createAccount(payload)`

2. Retrieve All Accounts
   - Controller: `GET /api/accounts`
   - Service: `getAll()`

3. Retrieve Account by ID
   - Controller: `GET /api/accounts/:id`
   - Service: `getAccount(id)`

4. Update an Account
   - Controller: `PUT /api/accounts/:id`
   - Service: `updateAccount(id, payload)`

5. Delete an Account
   - Controller: `DELETE /api/accounts/:id`
   - Service: `deleteAccount(id)`

All data is stored in-memory by `src/repository/accountRepo.js` for simplicity. For production, replace repository with a persistent store.
