const express = require('express');
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares/authMiddleware');
const {
    createGroupValidator,
    updateGroupValidator,
    addMembersValidator,
    groupIdParamValidator
} = require('../validators/groupValidators');

const router = express.Router();

router.use(authMiddleware.protect);

router.post('/create', createGroupValidator, groupController.createGroup);

router.put('/update', updateGroupValidator, groupController.updateGroup);

router.post('/add-members', addMembersValidator, groupController.addMembers);

router.post('/remove-members', addMembersValidator, groupController.removeMembers);

router.get('/my-groups', groupController.getGroupsByUser);

router.get('/email/:email', groupController.getGroupByEmail);

router.get('/status/:status', groupController.getGroupByStatus);

router.get('/audit/:groupId', groupIdParamValidator, groupController.getAuditLog);

module.exports = router;