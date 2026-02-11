const expenseDao = require('../dao/expenseDao');
const groupDao = require('../dao/groupDao');
const expenseService = require('../services/expenseService');
const { validationResult } = require('express-validator');

const expenseController = {
    addExpense: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { title, amount, groupId, paidBy, splitType, splitDetails } = req.body;

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
            // Only show active (unsettled) expenses in the history
            // History is cleared only after full group settlement
            const expenses = await expenseDao.getExpensesByGroup(groupId, false);
            res.status(200).json(expenses);
        } catch (error) {
            console.error('Get Expenses Error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    getGroupSummary: async (req, res) => {
        try {
            const { groupId } = req.params;
            const summary = await expenseService.getGroupSummary(groupId);
            res.status(200).json(summary);
        } catch (error) {
            console.error('Get Summary Error:', error);
            if (error.message === 'Group not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    recordPayment: async (req, res) => {
        try {
            const { groupId, fromEmail, toEmail, amount } = req.body;

            const settlementExpense = await expenseService.recordPayment(groupId, fromEmail, toEmail, amount);

            res.status(201).json({
                message: 'Payment recorded successfully',
                expense: settlementExpense
            });
        } catch (error) {
            console.error('Record Payment Error:', error);
            res.status(500).json({ message: error.message || 'Internal Server Error' });
        }
    },

    settleGroup: async (req, res) => {
        try {
            const { groupId } = req.body;
            const userEmail = req.user.email;

            console.log(`[Settlement] Starting settlement for group: ${groupId}, user: ${userEmail}`);
            await expenseService.settleUserDebts(groupId, userEmail);
            console.log(`[Settlement] Successfully recorded settlement for user: ${userEmail}`);

            res.status(200).json({ message: 'Settlement recorded. Your balance is now clear.' });
        } catch (error) {
            console.error('Settle Group Error:', error);
            res.status(500).json({ message: error.message || 'Internal Server Error' });
        }
    }
};

module.exports = expenseController;
