const express = require('express');
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares/authMiddleware');
const {
    createGroupValidator,
    updateGroupValidator,
    addMembersValidator,
    groupIdParamValidator
} = require('../validators/groupValidators');

const authorize = require('../middlewares/authorizeMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.post('/create', createGroupValidator, authorize('group:create'), groupController.createGroup);

router.put('/update', updateGroupValidator, authorize('group:update'), groupController.updateGroup);

router.post('/add-members', addMembersValidator, authorize('group:update'), groupController.addMembers);

router.post('/remove-members', addMembersValidator, authorize('group:update'), groupController.removeMembers);

router.get('/my-groups', authorize('group:view'), groupController.getGroupsByUser);

router.get('/email/:email', authorize('group:view'), groupController.getGroupByEmail);

router.get('/status/:status', authorize('group:view'), groupController.getGroupByStatus);

router.get('/audit/:groupId', groupIdParamValidator, authorize('group:view'), groupController.getAuditLog);

router.get('/:groupId', groupIdParamValidator, authorize('group:view'), groupController.getGroupById);

module.exports = router;