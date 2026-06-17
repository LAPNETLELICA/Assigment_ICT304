# API Test Documentation (JavaScript)

Endpoints:

- `POST /api/accounts` — Create account. Body: `{ "name": "Alice", "balance": 100 }` → 201 Created
- `GET /api/accounts` — List all accounts → 200 OK
- `GET /api/accounts/:id` — Get account by id → 200 OK or 404
- `PUT /api/accounts/:id` — Update account fields (name, balance) → 200 OK or 404
- `DELETE /api/accounts/:id` — Delete account → 204 No Content or 404

Suggested tests (implemented in `test/`): create, list, retrieve, update, delete, and idempotency checks.

Run tests with:

```powershell
npm test
npm run coverage
```

Coverage output is written to `coverage/` (HTML) and printed in the terminal.
