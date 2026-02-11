const Expense = require('../model/expense');

const expenseDao = {
    createExpense: async (data) => {
        const newExpense = new Expense(data);
        return await newExpense.save();
    },

    getExpensesByGroup: async (groupId, isSettled) => {
        const query = { groupId };
        if (isSettled !== undefined) query.isSettled = isSettled;
        return await Expense.find(query).sort({ createdAt: -1 });
    },

    markExpensesAsSettled: async (groupId) => {
        return await Expense.updateMany(
            { groupId, isSettled: false },
            { $set: { isSettled: true } }
        );
    }
};

module.exports = expenseDao;
