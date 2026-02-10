
const jwt = require('jsonwebtoken');
const authMiddleware = {
    protect: async (req, res, next) => {
        try {
            const token = req.cookies?.jwtToken;

            if (!token) {
                return res.status(401).json({
                    error: 'Unauthorized Access - No Token Provided'
                });
            }
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded;

                // Fallback: If role is missing in token, fetch from DB
                if (!req.user.role) {
                    const User = require('../model/user');
                    const user = await User.findById(req.user.userId);
                    if (user) {
                        req.user.role = user.role;
                        req.user.adminId = user.adminId;
                    }
                }

                next();
            } catch (error) {
                return res.status(401).json({
                    error: 'Unauthorized Access - Invalid Token'
                });
            }
        } catch (error) {
            console.log(error);
        }
    }
};
module.exports = authMiddleware;