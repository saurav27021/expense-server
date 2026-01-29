const userDao = require('../dao/userDao');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authController = {

    // ================= LOGIN =================
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    message: 'Email and Password are required'
                });
            }

            const user = await userDao.findByEmail(email);

            // user exist check (MOST IMPORTANT)
            if (!user) {
                return res.status(400).json({
                    message: 'Invalid email or password'
                });
            }

            const isPasswordMatched = await bcrypt.compare(
                password,
                user.password
            );
            if(user && isPasswordMatched){
                const token = jwt.sign({
                    name: user.name,
                    email: user.email,
                    id: user._id
                }, process.env.JWT_SECRET, {
                    expiresIn: '1h'
                });
                res.cookie('jwtToken',token,{
                    httpOnly: true, 
                    secure: true,   //data is encrypted work only if connection is https
                    domain: 'localhost',
                    path: '/'      //on which path cookie is valid
                });
                return res.status(200).json({
                    message: 'User Authenticated',
                    user: user
                });
            }

            if (!isPasswordMatched) {
                return res.status(400).json({
                    message: 'Invalid email or password'
                });
            }

            return res.status(200).json({
                message: 'User Authenticated',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                }
            });

        } catch (error) {
            console.error('Login Error:', error);
            return res.status(500).json({
                message: 'Internal Server Error'
            });
        }
    },

    // ================= REGISTER =================
    register: async (req, res) => {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({
                    message: 'Name, Email and Password are required'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const user = await userDao.create({
                name: name,
                email: email,
                password: hashedPassword
            });

            return res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user._id
                }
            });

        } catch (error) {
            if (error.code === 'USER_EXIST') {
                return res.status(400).json({
                    message: 'User with this email already exists'
                });
            }

            console.error('Register Error:', error);
            return res.status(500).json({
                message: 'Internal Server Error'
            });
        }
    }
};

module.exports = authController;
