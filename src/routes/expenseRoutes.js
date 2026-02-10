const express = require('express');
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorizeMiddleware');
const { addExpenseValidator, groupIdParamValidator } = require('../validators/expenseValidators');

const router = express.Router();

// All expense routes require authentication
router.use(authMiddleware.protect);

router.post('/add', addExpenseValidator, authorize('group:update'), expenseController.addExpense);
router.get('/group/:groupId', groupIdParamValidator, authorize('group:view'), expenseController.getExpensesByGroup);
router.get('/summary/:groupId', groupIdParamValidator, authorize('group:view'), expenseController.getGroupSummary);
router.post('/record-payment', authorize('group:update'), expenseController.recordPayment);
router.post('/settle', authorize('group:update'), expenseController.settleGroup);

module.exports = router;
