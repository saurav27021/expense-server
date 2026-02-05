const User = require('../model/user');

const rbacDao = {
    create: async (userData) => {
        return await User.create({
            email: userData.email,
            password: userData.password,
            name: userData.name,
            role: userData.role,
            adminId: userData._id
        });
    },

    update: async (userId, updateData) => {
        const { name, role } = updateData;
        return await User.findByIdAndUpdate(
            userId,
            { name, role },
            { new: true }
        );
    },

    delete: async (userId) => {
        return await User.findByIdAndDelete(userId);
    },

    getUserByAdminId: async (adminId) => {
        return await User.find({ adminId }).select('-password');
    }
};

module.exports = rbacDao;
