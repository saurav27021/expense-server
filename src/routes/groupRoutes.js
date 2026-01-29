const express = require('express');
const groupController = require('../controllers/groupController');

const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);
router.post('/create',groupController.createGroup);


router.put('/update', groupController.updateGroup);

router.post('/add-members', groupController.addMembers);

router.post('/remove-members', groupController.removeMembers);

router.get('/email/:email', groupController.getGroupByEmail);

router.get('/status/:status', groupController.getGroupByStatus);

router.get('/audit/:groupId', groupController.getAuditLog);


module.exports = router;