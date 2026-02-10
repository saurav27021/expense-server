const { PERMISSIONS } = require('../utility/permissions');

const authorize = (permission) => {
    return (req, res, next) => {
        const user = req.user;

        if (!user || !user.role) {
            return res.status(403).json({ message: 'Access denied: No role assigned' });
        }

        const userPermissions = PERMISSIONS[user.role.toLowerCase()] || [];

        if (userPermissions.includes(permission)) {
            next();
        } else {
            res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action' });
        }
    };
};

module.exports = authorize;
