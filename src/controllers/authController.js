const userDao = require('../dao/userDao');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authController = {

    // ================= LOGIN =================
    login: async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and Password are required"
            });
        }

        const user = await userDao.findByEmail(email);

        if (!user) {
            return res.status(401).json({
                error: "Invalid credentials"
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                error: "Invalid credentials"
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
            message: "Login successful"

        });
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
    googleLogin: async (req, res) => {
        try {
            const { token } = req.body;

            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            const { email, name, picture, sub: googleId } = payload;

            let user = await userDao.findByEmail(email);

            if (!user) {
                // Create user if not exists (using a random password as it won't be used for Google users)
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), salt);

                user = await userDao.create({
                    name,
                    email,
                    password: hashedPassword
                });
            }

            const jwtToken = jwt.sign({
                name: user.name,
                email: user.email,
                id: user._id
            }, process.env.JWT_SECRET, {
                expiresIn: '1h'
            });

            res.cookie('jwtToken', jwtToken, {
                httpOnly: true,
                secure: true,
                domain: 'localhost',
                path: '/'
            });

            return res.status(200).json({
                message: 'User Authenticated via Google',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    picture
                }
            });

        } catch (error) {
            console.error('Google Login Error:', error);
            return res.status(401).json({
                message: 'Invalid Google Token'
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
