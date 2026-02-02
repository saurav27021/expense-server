const express = require('express');
const groupController = require('../controllers/authController'); // Wait, looking at the previous view_file, it was groupController.
const actualGroupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares/authMiddleware');
const {
    createGroupValidator,
    updateGroupValidator,
    addMembersValidator,
    groupIdParamValidator
} = require('../validators/groupValidators');

const router = express.Router();

router.use(authMiddleware.protect);

router.post('/create', createGroupValidator, actualGroupController.createGroup);

router.put('/update', updateGroupValidator, actualGroupController.updateGroup);

router.post('/add-members', addMembersValidator, actualGroupController.addMembers);

router.post('/remove-members', addMembersValidator, actualGroupController.removeMembers);

router.get('/email/:email', actualGroupController.getGroupByEmail);

router.get('/status/:status', actualGroupController.getGroupByStatus);

router.get('/audit/:groupId', groupIdParamValidator, actualGroupController.getAuditLog);

module.exports = router;