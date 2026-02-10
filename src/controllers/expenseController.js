const expenseDao = require('../dao/expenseDao');
const groupDao = require('../dao/groupDao');
const { validationResult } = require('express-validator');

const expenseController = {
    addExpense: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { title, amount, groupId, paidBy, splitType, splitDetails } = req.body;

            // 1. Verify Group Exists
            const group = await groupDao.getGroupsPaginated(paidBy, 1, 0); // Temporary check using DAO
            // Better: find group by ID and check if user is in membersEmail

            // For now, let's assume the group exists and validation is handled by middlewares if possible
            // or perform a direct check

            // 2. Validate Split Sum if Unequal
            if (splitType === 'unequal') {
                const totalSplitAmount = splitDetails.reduce((sum, item) => sum + (item.amount || 0), 0);
                if (Math.abs(totalSplitAmount - amount) > 0.01) {
                    return res.status(400).json({ message: "Split amounts must sum up to the total amount" });
                }
            }

            const newExpense = await expenseDao.createExpense({
                title, amount, groupId, paidBy, splitType, splitDetails
            });

            res.status(201).json({
                message: 'Expense added successfully',
                expense: newExpense
            });

        } catch (error) {
            console.error('Add Expense Error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    getExpensesByGroup: async (req, res) => {
        try {
            const { groupId } = req.params;
            const expenses = await expenseDao.getExpensesByGroup(groupId);
            res.status(200).json(expenses);
        } catch (error) {
            console.error('Get Expenses Error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    getGroupSummary: async (req, res) => {
        try {
            const { groupId } = req.params;
            const expenses = await expenseDao.getExpensesByGroup(groupId, false); // Only unsettled

            const balances = {}; // { email: net_balance }
            const members = new Set();

            expenses.forEach(expense => {
                const payer = expense.paidBy;
                members.add(payer);

                balances[payer] = (balances[payer] || 0) + expense.amount;

                expense.splitDetails.forEach(split => {
                    members.add(split.email);
                    if (!split.excluded) {
                        balances[split.email] = (balances[split.email] || 0) - split.amount;
                    }
                });
            });

            // Calculate P2P debts (Who owes whom)
            // Strategy: Greedy algorithm to settle net balances
            const debtors = [];
            const creditors = [];

            Object.keys(balances).forEach(email => {
                if (balances[email] < -0.01) debtors.push({ email, amount: Math.abs(balances[email]) });
                else if (balances[email] > 0.01) creditors.push({ email, amount: balances[email] });
            });

            const p2pDebts = [];
            let d = 0, c = 0;
            while (d < debtors.length && c < creditors.length) {
                const amount = Math.min(debtors[d].amount, creditors[c].amount);
                p2pDebts.push({
                    from: debtors[d].email,
                    to: creditors[c].email,
                    amount: Number(amount.toFixed(2))
                });

                debtors[d].amount -= amount;
                creditors[c].amount -= amount;

                if (debtors[d].amount < 0.01) d++;
                if (creditors[c].amount < 0.01) c++;
            }

            res.status(200).json({ balances, p2pDebts });
        } catch (error) {
            console.error('Get Summary Error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    recordPayment: async (req, res) => {
        try {
            const { groupId, fromEmail, toEmail, amount } = req.body;

            // Record this as a special "Payment" expense
            // Razorpay will be implemented here later
            const settlementExpense = await expenseDao.createExpense({
                title: `Payment: ${fromEmail.split('@')[0]} to ${toEmail.split('@')[0]}`,
                amount: amount,
                groupId: groupId,
                paidBy: fromEmail,
                splitType: 'unequal',
                splitDetails: [{
                    email: toEmail,
                    amount: amount,
                    excluded: false
                }]
            });

            res.status(201).json({
                message: 'Payment recorded successfully',
                expense: settlementExpense
            });
        } catch (error) {
            console.error('Record Payment Error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    settleGroup: async (req, res) => {
        try {
            const { groupId } = req.body;

            // 1. Mark all expenses as settled
            await expenseDao.markExpensesAsSettled(groupId);

            // 2. Update Group payment status (if you want to track last settlement)
            // This part depends on how the group model is intended to be used for settlement
            await groupDao.updateGroup(groupId, {
                paymentStatus: {
                    amount: 0,
                    date: new Date(),
                    isPaid: true
                }
            });

            res.status(200).json({ message: 'Group settled successfully. All balances are now zero.' });
        } catch (error) {
            console.error('Settle Group Error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

module.exports = expenseController;
