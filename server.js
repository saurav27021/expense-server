require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const authRoutes = require('./src/routes/authRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const rbacRoutes = require('./src/routes/rbacRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');


mongoose.connect(process.env.MONGO_DB_CONNECTION_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch((error) => console.log('Error Connecting to Database: ', error));

const app = express();

const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());  //Middleware
app.use(cookieParser());  //Middleware to parse cookies 

app.use('/auth/', authRoutes);
app.use('/group/', groupRoutes);
app.use('/rbac/', rbacRoutes);
app.use('/expense/', expenseRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});



app.listen(5001, () => {
    console.log('Server is running on port 5001');
});
