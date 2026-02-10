const userDao = require('../dao/userDao');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { validationResult } = require('express-validator');
const { ADMIN_ROLE } = require('../utility/userRoles');

const authController = {

    // ================= LOGIN =================
    login: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }
        const { email, password } = req.body;


        const user = await userDao.findByEmail(email);

        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        // Check if user is Google SSO user and has no password
        if (user.googleId && !user.password) {
            return res.status(401).json({
                message: "please login using google sso"
            });
        }

        const isPasswordMatched = await bcrypt.compare(password, user?.password);

        if (!user || !isPasswordMatched) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        // CREATE JWT
        const userRole = user.role || ADMIN_ROLE || 'admin';
        const userAdminId = user.adminId || user._id;

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: userRole,
                adminId: userAdminId
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        //  SET COOKIE
        res.cookie('jwtToken', token, {
            httpOnly: true,
            secure: false, // true only in HTTPS
            sameSite: 'strict'
        });

        //  SEND RESPONSE
        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: userRole,
                adminId: userAdminId
            }
        });
    },

    // ================= REGISTER =================
    register: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array()
                });
            }

            const { name, email, password } = req.body;


            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const user = await userDao.create({
                name: name,
                email: email,
                password: hashedPassword,
                role: 'admin' // Default role for new registration
            });

            // CREATE JWT
            const userRole = user.role || 'admin';
            const userAdminId = user.adminId || user._id;

            const token = jwt.sign(
                {
                    userId: user._id,
                    email: user.email,
                    role: userRole,
                    adminId: userAdminId
                },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // SET COOKIE
            res.cookie('jwtToken', token, {
                httpOnly: true,
                secure: false, // true only in HTTPS
                sameSite: 'strict'
            });

            return res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: userRole,
                    adminId: userAdminId
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
    },

    // ================= GOOGLE LOGIN =================
    googleSso: async (req, res) => {
        try {
            const { idToken } = req.body;

            if (!idToken) {
                return res.status(400).json({ message: "Invalid request - Missing ID Token" });
            }

            const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

            let googleResponse;
            try {
                googleResponse = await googleClient.verifyIdToken({
                    idToken: idToken,
                    audience: process.env.GOOGLE_CLIENT_ID
                });
            } catch (verifyError) {
                console.error('Google Token Verification Failed:', verifyError.message);
                return res.status(401).json({
                    message: 'Invalid Google Token',
                    error: verifyError.message
                });
            }

            const payload = googleResponse.getPayload();
            if (!payload) {
                return res.status(401).json({ message: "Invalid Google Payload" });
            }

            const { sub: googleId, name, email } = payload;

            if (!email) {
                return res.status(400).json({ message: "Google account must have an email associated" });
            }

            let user = await userDao.findByEmail(email);

            if (!user) {
                // New user registration via Google SSO
                user = await userDao.create({
                    name,
                    email,
                    googleId,
                    role: 'admin' // Default role for new signups
                });
            } else if (!user.googleId) {
                // Existing user logging in with Google for the first time
                // Link Google account to existing user
                user.googleId = googleId;
                await user.save();
            }

            const userRole = user.role || 'admin';
            const userAdminId = user.adminId || user._id;

            const token = jwt.sign(
                {
                    userId: user._id,
                    email: user.email,
                    role: userRole,
                    adminId: userAdminId
                },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.cookie('jwtToken', token, {
                httpOnly: true,
                secure: false, // use true in production (HTTPS)
                sameSite: 'strict'
            });

            return res.status(200).json({
                message: "Login successful",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: userRole,
                    adminId: userAdminId
                }
            });

        } catch (error) {
            console.error('Google SSO Internal Error:', error);
            return res.status(500).json({
                message: 'Internal Server Error during Google SSO',
                error: error.message
            });
        }
    },

    // ================= CHECK SESSION =================
    isUserLoggedIn: async (req, res) => {
        try {
            const token = req.cookies.jwtToken;

            if (!token) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await userDao.findByEmail(decoded.email);

            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            return res.status(200).json({
                message: 'User is logged in',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                }
            });

        } catch (error) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
    },

    // ================= LOGOUT =================
    logout: async (req, res) => {
        res.clearCookie('jwtToken');
        return res.status(200).json({ message: 'Logged out successfully' });
    }
};

module.exports = authController;
