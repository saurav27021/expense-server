const Expense = require('../model/expense');

const expenseDao = {
    createExpense: async (data) => {
        const newExpense = new Expense(data);
        return await newExpense.save();
    },

    getExpensesByGroup: async (groupId, isSettled = false) => {
        return await Expense.find({ groupId, isSettled }).sort({ createdAt: -1 });
    },

    markExpensesAsSettled: async (groupId) => {
        return await Expense.updateMany(
            { groupId, isSettled: false },
            { $set: { isSettled: true } }
        );
    }
};

module.exports = expenseDao;
