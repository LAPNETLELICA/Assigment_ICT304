const express = require('express');
const cors = require('cors');
const path = require('path');
const accountRouter = require('./controller/accountController');
const authRouter = require('./controller/authController');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/accounts', accountRouter);
app.use('/api/auth', authRouter);
app.use(express.static(path.join(__dirname, '..', 'public')));

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => console.log(`Server listening on ${port}`));
}

module.exports = app;
