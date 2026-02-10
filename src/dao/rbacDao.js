const User = require('../model/user');

const rbacDao = {
    create: async (userData, adminId) => {
        return await User.create({
            email: userData.email,
            password: userData.password,
            name: userData.name,
            role: userData.role,
            adminId: adminId
        });
    },

    update: async (userId, updateData) => {
        const user = await User.findById(userId);
        if (!user) return null;

        if (updateData.name) user.name = updateData.name;
        if (updateData.role) user.role = updateData.role;

        return await user.save();
    },

    delete: async (userId) => {
        return await User.findByIdAndDelete(userId);
    },

    getUserByAdminId: async (adminId) => {
        return await User.find({ adminId }).select('-password');
    }
};

module.exports = rbacDao;
