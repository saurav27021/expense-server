const expenseDao = require('../dao/expenseDao');
const groupDao = require('../dao/groupDao');
const fs = require('fs');
const path = require('path');

const logDebug = (msg) => {
    try {
        fs.appendFileSync(path.join(__dirname, '../../debug.log'), `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) { console.error('Log failed', e); }
};

/**
 * Service to handle complex expense calculations and group settlement.
 */
const expenseService = {

    getGroupSummary: async (groupId) => {
        const group = await groupDao.getGroupById(groupId);
        if (!group) throw new Error('Group not found');

        const expenses = await expenseDao.getExpensesByGroup(groupId, false);

        const balances = expenseService.calculateBalances(group.membersEmail, expenses);
        const p2pDebts = expenseService.calculateP2P(balances);

        return { balances, p2pDebts };
    },

    /**
     * Core calculation engine for member balances.
     * @param {Array} membersEmail 
     * @param {Array} expenses 
     * @returns {Object} balances
     */
    calculateBalances: (membersEmail, expenses) => {
        const balances = {};
        if (membersEmail && Array.isArray(membersEmail)) {
            membersEmail.forEach(email => {
                balances[email] = 0;
            });
        }

        expenses.forEach(expense => {
            const payer = expense.paidBy;
            if (balances[payer] === undefined) balances[payer] = 0;
            balances[payer] = Number((balances[payer] + expense.amount).toFixed(2));

            expense.splitDetails.forEach(split => {
                if (balances[split.email] === undefined) balances[split.email] = 0;
                if (!split.excluded) {
                    balances[split.email] = Number((balances[split.email] - split.amount).toFixed(2));
                }
            });
        });

        // Normalize and handle residue
        Object.keys(balances).forEach(email => {
            balances[email] = Number(balances[email].toFixed(2));
        });

        const balanceSum = Object.values(balances).reduce((a, b) => a + b, 0);
        if (Math.abs(balanceSum) >= 0.01) {
            // Absorb residue into the person with the largest absolute balance
            const mainMember = Object.keys(balances).reduce((a, b) =>
                Math.abs(balances[a]) > Math.abs(balances[b]) ? a : b
                , Object.keys(balances)[0]);

            if (mainMember) {
                balances[mainMember] = Number((balances[mainMember] - balanceSum).toFixed(2));
            }
        }

        // Final cleanup for tiny floating point errors
        Object.keys(balances).forEach(email => {
            balances[email] = Number(balances[email].toFixed(2));
            if (Math.abs(balances[email]) < 0.01) balances[email] = 0;
        });

        return balances;
    },

    /**
     * Simplified greedy algorithm for peer-to-peer debts.
     * @param {Object} balances 
     * @returns {Array} p2pDebts
     */
    calculateP2P: (balances) => {
        const debtors = [];
        const creditors = [];

        Object.keys(balances).forEach(email => {
            if (balances[email] < 0) debtors.push({ email, amount: Math.abs(balances[email]) });
            else if (balances[email] > 0) creditors.push({ email, amount: balances[email] });
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

            debtors[d].amount = Number((debtors[d].amount - amount).toFixed(2));
            creditors[c].amount = Number((creditors[c].amount - amount).toFixed(2));

            if (debtors[d].amount < 0.01) d++;
            if (creditors[c].amount < 0.01) c++;
        }

        return p2pDebts;
    },

    /**
     * Settles all outstanding debts for a specific user in a group.
     * Records offsetting payment expenses to bring the user's balance to zero.
     * @param {string} groupId 
     * @param {string} userEmail 
     */
    settleUserDebts: async (groupId, userEmail) => {
        try {
            logDebug(`[Service:Settle] Fetching initial summary for group ${groupId}`);
            const { p2pDebts } = await expenseService.getGroupSummary(groupId);

            // Find all debts involving this user
            const userDebts = p2pDebts.filter(debt => debt.from === userEmail || debt.to === userEmail);

            logDebug(`[Service:Settle] Found ${userDebts.length} user-specific debts for ${userEmail}`);
            if (userDebts.length === 0) return;

            for (const debt of userDebts) {
                logDebug(`[Service:Settle] Recording payment: ${debt.from} -> ${debt.to} amount ${debt.amount}`);
                await expenseDao.createExpense({
                    title: `Settlement: ${debt.from.split('@')[0]} to ${debt.to.split('@')[0]}`,
                    amount: debt.amount,
                    groupId: groupId,
                    paidBy: debt.from,
                    splitType: 'unequal',
                    splitDetails: [{
                        email: debt.to,
                        amount: debt.amount,
                        excluded: false
                    }],
                    isSettled: false
                });
            }

            // After individual settlement, check if the WHOLE group is now at zero
            logDebug(`[Service:Settle] Re-summarizing group to check if all balances are zero`);
            const { balances: newBalances } = await expenseService.getGroupSummary(groupId);
            logDebug(`[Service:Settle] New Balances: ${JSON.stringify(newBalances)}`);

            const isFullySettled = Object.values(newBalances).every(val => Math.abs(val) < 0.01);
            logDebug(`[Service:Settle] isFullySettled check: ${isFullySettled}`);

            if (isFullySettled) {
                logDebug(`[Service:Settle] FULL RESOLUTION REACHED. Archiving group history.`);
                await expenseService.settleGroup(groupId);
            }
        } catch (error) {
            logDebug(`[Service:Settle] Error in settleUserDebts: ${error.message}\n${error.stack}`);
            throw error;
        }
    },

    /**
     * Records a single P2P payment and checks for full group settlement.
     * @param {string} groupId 
     * @param {string} fromEmail 
     * @param {string} toEmail 
     * @param {number} amount 
     */
    recordPayment: async (groupId, fromEmail, toEmail, amount) => {
        const expense = await expenseDao.createExpense({
            title: `Payment: ${fromEmail.split('@')[0]} to ${toEmail.split('@')[0]}`,
            amount: amount,
            groupId: groupId,
            paidBy: fromEmail,
            splitType: 'unequal',
            splitDetails: [{
                email: toEmail,
                amount: amount,
                excluded: false
            }],
            isSettled: false
        });

        // Check for full settlement
        logDebug(`[Service:Payment] Checking for full settlement after payment`);
        const { balances } = await expenseService.getGroupSummary(groupId);
        logDebug(`[Service:Payment] New Balances: ${JSON.stringify(balances)}`);

        const isFullySettled = Object.values(balances).every(val => Math.abs(val) < 0.01);
        logDebug(`[Service:Payment] isFullySettled? ${isFullySettled}`);

        if (isFullySettled) {
            logDebug(`[Service:Payment] FULL RESOLUTION REACHED. Archiving.`);
            await expenseService.settleGroup(groupId);
        }

        return expense;
    },

    /**
     * Mark all current expenses as settled (Full Reset).
     * @param {string} groupId 
     */
    settleGroup: async (groupId) => {
        await expenseDao.markExpensesAsSettled(groupId);
        await groupDao.updateGroup(groupId, {
            paymentStatus: {
                amount: 0,
                date: new Date(),
                isPaid: true
            }
        });
    }
};

module.exports = expenseService;
