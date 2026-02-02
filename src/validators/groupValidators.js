const { body, param } = require('express-validator');

const createGroupValidator = [
    body('name')
        .notEmpty().withMessage("Group name is required")
        .trim(),
    body('description')
        .optional()
        .trim(),
    body('membersEmail')
        .optional()
        .isArray().withMessage("Members email must be an array of strings"),
    body('membersEmail.*')
        .isEmail().withMessage("Invalid member email format")
];

const updateGroupValidator = [
    body('groupId')
        .notEmpty().withMessage("Group ID is required"),
    body('name')
        .optional()
        .trim(),
    body('description')
        .optional()
        .trim()
];

const addMembersValidator = [
    body('groupId')
        .notEmpty().withMessage("Group ID is required"),
    body('membersEmail')
        .notEmpty().withMessage("Members email is required")
        .isArray().withMessage("Members email must be an array of strings"),
    body('membersEmail.*')
        .isEmail().withMessage("Invalid member email format")
];

const groupIdParamValidator = [
    param('groupId')
        .notEmpty().withMessage("Group ID is required")
];

module.exports = {
    createGroupValidator,
    updateGroupValidator,
    addMembersValidator,
    groupIdParamValidator
};
