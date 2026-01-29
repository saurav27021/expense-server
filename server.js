const express = require('express');
const authRoutes = require('./src/routes/authRoutes.js');

const app = express();

app.use(express.json()); // Middleware

app.use('/auth', authRoutes);

app.listen(5001, () => {
  console.log('Server is running on port 5001');
});
