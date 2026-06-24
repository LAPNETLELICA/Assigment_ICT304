import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import accountRouter from './controller/accountController.js';
import authRouter from './controller/authController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/accounts', accountRouter);
app.use('/api/auth', authRouter);
app.use(express.static(path.join(__dirname, '..', 'public')));

const port = process.env.PORT || 3000;

// Only bind to the port when not running inside the test suite.
// supertest creates its own ephemeral connections so no explicit listen is needed.
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Server listening on ${port}`));
}

export default app;
