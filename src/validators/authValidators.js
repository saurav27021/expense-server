const { body } = require('express-validator');

const loginValidator = [
    body('email')
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Provided email is not verified"),
    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 3 }).withMessage("Password must be at least 3 characters long")
];

const registerValidator = [
    body('name')
        .notEmpty().withMessage("Name is required")
        .trim(),
    body('email')
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Provided email is not verified")
        .normalizeEmail(),
    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 3 }).withMessage("Password must be at least 3 characters long")
];

module.exports = {
    loginValidator,
    registerValidator
};
