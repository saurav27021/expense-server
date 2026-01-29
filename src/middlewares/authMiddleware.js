
const jwt = require('jsonwebtoken');
const authMiddleware = {
    protect: async (req, res, next) => {
        try{
            const token = req.cookies?.jwtToken;

            if(!token){
                return res.status(401).json({
                    error: 'Unauthorized Access - No Token Provided'
                });
            }
            try{
                const user = jwt.verify(token, process.env.JWT_SECRET);
                req.user = user;
                next();
            }catch(error){
                return res.status(401).json({
                    error: 'Unauthorized Access - Invalid Token'
                });
            }
        }catch(error){
            console.log(error);
        }
    }
};
module.exports = authMiddleware;