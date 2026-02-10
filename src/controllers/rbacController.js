const rbacDao = require('../dao/rbacDao');
const emailService = require('../services/emailService');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const passwordUtil = require('../utility/passwordUtil');

const rbacController = {
    create: async (req, res) => {
        try {
            const { name, email, role } = req.body;
            const adminId = req.user.id || req.user._id;

            // Generate a random temporary password
            const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 characters
            const hashedPassword = await passwordUtil.hashPassword(tempPassword);

            const newUser = await rbacDao.create({
                name,
                email,
                password: hashedPassword,
                role
            }, adminId);

            // Notify the user via email with the temporary password
            try {
                await emailService.send(
                    email,
                    'Welcome to the ExpenseApp Team!',
                    `Hi ${name},\n\nYou have been added as a ${role} to the ExpenseApp by your administrator.\n\nYour temporary login details:\nEmail: ${email}\nPassword: ${tempPassword}\n\nPlease log in at http://localhost:5173/login and change your password in your settings.\n\nCheers!`
                );
            } catch (emailError) {
                console.error(`Failed to send welcome email to ${email}:`, emailError.message);
            }

            res.status(201).json({
                message: 'User created successfully',
                user: {
                    _id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    update: async (req, res) => {
        try {
            console.log('Update User Request Received. Body:', req.body);
            const { userId, name, role } = req.body;

            if (!userId) {
                return res.status(400).json({ message: "User ID is required" });
            }

            const updatedUser = await rbacDao.update(userId, { name, role });

            if (!updatedUser) {
                console.warn(`User with ID ${userId} not found for update.`);
                return res.status(404).json({ message: "User not found" });
            }

            console.log('User successfully updated in DB:', {
                id: updatedUser._id,
                name: updatedUser.name,
                role: updatedUser.role
            });

            res.status(200).json(updatedUser);
        } catch (error) {
            console.error('Update User Controller Error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    delete: async (req, res) => {
        try {
            const { userId } = req.body;
            await rbacDao.delete(userId);
            res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const adminId = req.user.id || req.user._id;
            const users = await rbacDao.getUserByAdminId(adminId);
            res.status(200).json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

module.exports = rbacController;
