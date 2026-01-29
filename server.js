const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./src/routes/authRoutes');
require('dotenv').config();

mongoose.connect(process.env.MONGO_DB_CONNECTION_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((error) => console.log('Error Connecting to Database: ', error));

const app = express();

app.use(express.json()); // Middleware

app.use('/auth', authRoutes);

app.listen(5001, () => {
  console.log('Server is running on port 5001');
});
