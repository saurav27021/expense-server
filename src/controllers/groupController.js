const groupDao = require('../dao/groupDao');
const emailService = require('../services/emailService');
const { validationResult } = require('express-validator');

const groupController = {
    createGroup: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const user = req.user;
            const {
                name, description,
                membersEmail, thumbnail,
            } = req.body;

            let allMembers = [user.email];

            if (membersEmail && Array.isArray(membersEmail)) {
                allMembers = [...new Set([...allMembers, ...membersEmail])];
            }

            const newGroup = await groupDao.createGroup({
                name,
                description,
                adminEmail: user.email,
                membersEmail: allMembers,
                thumbnail,
                paymentStatus: {
                    amount: 0,
                    currency: 'INR',
                    date: Date.now(),
                    isPaid: false,
                }
            });

            res.status(200).json({
                message: 'Group created successfully',
                groupId: newGroup._id
            });

        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: 'Internal Server Error'
            });
        }
    },
    updateGroup: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { groupId, ...updateData } = req.body;
            const updatedGroup = await groupDao.updateGroup(groupId, updateData);

            res.status(200).json(updatedGroup);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    addMembers: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { groupId, membersEmail } = req.body;

            const group = await groupDao.addMembers(groupId, ...membersEmail);

            // Send invitation emails
            for (const email of membersEmail) {
                try {
                    await emailService.send(
                        email,
                        `You have been invited to join ${group.name}`,
                        `Hi,\n\nYou have been added to the group "${group.name}" on ExpenseApp. Log in to start splitting bills!\n\nCheers!`
                    );
                } catch (emailError) {
                    console.error(`Failed to send invite to ${email}:`, emailError.message);
                }
            }

            res.status(200).json(group);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    removeMembers: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { groupId, membersEmail } = req.body;
            const user = req.user;

            const group = await groupDao.getGroupById(groupId);
            if (!group) return res.status(404).json({ message: 'Group not found' });

            // Allow both admin role users and group creators to remove members
            const isGroupCreator = group.adminEmail === user.email;
            const isAdminRole = user.role && user.role.toLowerCase() === 'admin';

            if (!isGroupCreator && !isAdminRole) {
                return res.status(403).json({ message: 'Only the Group Creator or Admin can remove members.' });
            }

            if (membersEmail.includes(user.email)) {
                return res.status(400).json({ message: 'You cannot remove yourself from the group.' });
            }

            const { balances } = await require('../services/expenseService').getGroupSummary(groupId);

            for (const email of membersEmail) {
                const balance = balances[email] || 0;
                if (Math.abs(balance) > 0.01) {
                    return res.status(400).json({
                        message: `Cannot remove ${email.split('@')[0]} because they have a non-zero balance of ₹${balance}. Settle debts first.`
                    });
                }
            }

            const updatedGroup = await groupDao.removeMembers(groupId, ...membersEmail);
            res.status(200).json(updatedGroup);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    getGroupByEmail: async (req, res) => {
        try {
            const { email } = req.params;
            const groups = await groupDao.getGroupByEmail(email);
            res.status(200).json(groups);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    getGroupByStatus: async (req, res) => {
        try {
            const { status } = req.params;
            const groups = await groupDao.getGroupByStatus(status === 'true');
            res.status(200).json(groups);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    getAuditLog: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { groupId } = req.params;

            const auditLog = await groupDao.getAuditLog(groupId);
            res.status(200).json(auditLog);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    getGroupsByUser: async (req, res) => {
        try {
            const user = req.user;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const sortBy = req.query.sortBy || 'newest';
            let sortOptions = { createdAt: -1 };
            if (sortBy === 'oldest') {
                sortOptions = { createdAt: 1 };
            }

            const { groups, totalCount } = await groupDao.getGroupsPaginated(
                user.email,
                limit,
                skip,
                sortOptions
            );

            const totalPages = Math.ceil(totalCount / limit);

            res.status(200).json({
                groups,
                pagination: {
                    totalItems: totalCount,
                    totalPages,
                    currentPage: page,
                    itemsPerPage: limit
                }
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    getGroupById: async (req, res) => {
        try {
            const { groupId } = req.params;
            const group = await groupDao.getGroupById(groupId);
            if (!group) {
                return res.status(404).json({ message: 'Group not found' });
            }
            res.status(200).json(group);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
};

module.exports = groupController;