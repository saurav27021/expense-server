const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    paidBy: { type: String, required: true }, // Email of the payer
    splitType: { type: String, enum: ['equal', 'unequal'], default: 'equal' },
    splitDetails: [{
        email: { type: String, required: true },
        amount: { type: Number, required: true },
        excluded: { type: Boolean, default: false }
    }],
    isSettled: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', expenseSchema);
