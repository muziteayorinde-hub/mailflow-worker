require('dotenv').config();

const express = require('express');
const cors = require('cors');

const mailRoutes = require('./routes/mail');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'MailFlow Worker Running'
  });
});

app.use('/mail', mailRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`MailFlow Worker running on port ${PORT}`);
});
