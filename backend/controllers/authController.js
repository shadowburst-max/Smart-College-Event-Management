import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const ADMIN_EMAIL = 'kushv0703@gmail.com';

const normalizeAdminRole = async (user) => {
    if (!user) return user;
    if (user.email === ADMIN_EMAIL && user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
    }
    return user;
};

// Register a new user
export const register = async (req, res, next) => {
    const { name, email, password, interests } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create new user with interests array (defaults to empty if not provided)
        const newUser = new User({
            name,
            email,
            passwordHash,
            interests: interests || [],
            role: email === 'kushv0703@gmail.com' ? 'admin' : 'student'
        });

        await newUser.save();
        logger.logInfo(`User registered: ${email}`);

        const token = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                interests: newUser.interests
            }
        });
    } catch (error) {
        logger.logError(`Registration error: ${error.message}`);
        next(error);
    }
};

// Login a user
export const login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        user = await normalizeAdminRole(user);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
        );

        logger.logInfo(`User logged in: ${email}`);

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                interests: user.interests
            }
        });
    } catch (error) {
        logger.logError(`Login error: ${error.message}`);
        next(error);
    }
};