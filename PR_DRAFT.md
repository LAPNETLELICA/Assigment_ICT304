# PR Draft: JS rewrite + transactions + persistence

Branch: appmod/js-rewrite-manual-session-20260617-001

Summary:
- Rewrote Java demo to JavaScript (Express)
- Added unit & integration tests (Vitest + Supertest)
- Implemented account transactions (deposit/withdraw)
- Implemented transfers between accounts
- Added JSON file persistence (data/db.json)
- Improved SPA UI with transfer modal and CSV export

Notes:
- Data persistence uses `data/db.json` in repository root; keep backup if needed.
- Tests run `npm test` (all passing locally)

Suggested PR description:
Include a high-level summary, migration notes, and testing instructions:

1. Run `npm install`
2. Start server: `node src/server.js`
3. Open `http://localhost:3000`
4. Run tests: `npm test`
5. Coverage: `npm run coverage`

Please review transaction semantics, especially transfer atomicity and persistence behavior.

---

Remote PR URL (create via browser):
https://github.com/LAPNETLELICA/Assigment_ICT304/pull/new/appmod/js-rewrite-manual-session-20260617-001
