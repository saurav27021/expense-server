const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    googleId: { type: String, required: false },
    role: { type: String, enum: ['admin', 'manager', 'viewer'], default: 'admin' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
});

module.exports = mongoose.model('User', userSchema);
