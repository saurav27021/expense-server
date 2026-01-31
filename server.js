require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const authRoutes = require('./src/routes/authRoutes');
const groupRoutes = require('./src/routes/groupRoutes');

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

// DEBUG: Request Logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use('/auth', authRoutes);
app.use('/group', groupRoutes);



app.listen(5001, () => {
    console.log('Server is running on port 5001');
});
