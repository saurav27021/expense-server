const { body, param } = require('express-validator');

const addExpenseValidator = [
    body('title')
        .notEmpty().withMessage("Expense title is required")
        .trim(),
    body('amount')
        .isNumeric().withMessage("Amount must be a number")
        .custom(value => value > 0).withMessage("Amount must be greater than 0"),
    body('groupId')
        .notEmpty().withMessage("Group ID is required"),
    body('paidBy')
        .isEmail().withMessage("Invalid payer email format"),
    body('splitType')
        .isIn(['equal', 'unequal']).withMessage("Split type must be 'equal' or 'unequal'"),
    body('splitDetails')
        .isArray({ min: 1 }).withMessage("Split details must be an array with at least one member"),
    body('splitDetails.*.email')
        .isEmail().withMessage("Invalid member email in split details"),
    body('splitDetails.*.amount')
        .isNumeric().withMessage("Split amount must be a number")
];

const groupIdParamValidator = [
    param('groupId')
        .notEmpty().withMessage("Group ID is required")
];

module.exports = {
    addExpenseValidator,
    groupIdParamValidator
};
