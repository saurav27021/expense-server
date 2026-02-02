const userDao = require('../dao/userDao');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { validationResult } = require('express-validator');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        // CREATE JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email },
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
                email: user.email
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
                password: hashedPassword
            });

            // CREATE JWT
            const token = jwt.sign(
                { userId: user._id, email: user.email },
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
                    email: user.email
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
                return res.status(401).json({ message: "Invalid request" });
            }

            const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

            const googleResponse = await googleClient.verifyIdToken({
                idToken: idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = googleResponse.getPayload();
            const { sub: googleId, name, email } = payload;

            let user = await userDao.findByEmail(email);

            if (!user) {
                user = await userDao.create({
                    name,
                    email,
                    googleId
                });
            }

            const token = jwt.sign(
                { userId: user._id, email: user.email },
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
                    email: user.email
                }
            });

        } catch (error) {
            console.error('Google Login Error:', error);
            return res.status(401).json({
                message: 'Invalid Google Token'
            });
        }
    }
    ,

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
