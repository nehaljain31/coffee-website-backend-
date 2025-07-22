const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/user');
const router = express.Router();


const registerSchema = Joi.object({
    username: Joi.string().min(3).max(20).required(),
    fullName: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
    address: Joi.object({
        street: Joi.string().allow(''),
        city: Joi.string().allow(''),
        state: Joi.string().allow(''),
        zipCode: Joi.string().allow(''),
        country: Joi.string().default('India')
    }).optional(),
    preferredTeas: Joi.array().items(
        Joi.string().valid('green', 'black', 'white', 'oolong', 'herbal', 'chai', 'matcha', 'bubble')
    ).optional(),
    dietaryPreferences: Joi.array().items(
        Joi.string().valid('vegan', 'lactose-free', 'sugar-free', 'organic', 'caffeine-free')
    ).optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});


const generateTokens = (userId, email, username) => {
    const accessToken = jwt.sign(
        { userId, email, username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
    
    return { accessToken, refreshToken };
};


router.post('/register', async (req, res) => {
    try {
        const { error } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.details[0].message
            });
        }

        const { username, fullName, email, password, phone, address, preferredTeas, dietaryPreferences } = req.body;

       
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'Account already exists',
                message: existingUser.email === email 
                    ? 'A tea house member with this email already exists'
                    : 'This username is already taken'
            });
        }

        
        const newUser = new User({
            username,
            fullName,
            email,
            password,
            phone,
            address: address || {},
            preferredTeas: preferredTeas || ['green'],
            dietaryPreferences: dietaryPreferences || [],
            membershipPoints: 100, 
            memberSince: new Date()
        });

        const savedUser = await newUser.save();

        
        const { accessToken, refreshToken } = generateTokens(savedUser._id, savedUser.email, savedUser.username);

        res.status(201).json({
            message: 'Welcome to ZenTea House family!',
            member: {
                id: savedUser._id,
                username: savedUser.username,
                fullName: savedUser.fullName,
                email: savedUser.email,
                phone: savedUser.phone,
                membershipPoints: savedUser.membershipPoints,
                membershipTier: savedUser.membershipTier,
                preferredTeas: savedUser.preferredTeas
            },
            tokens: {
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                error: 'Duplicate entry',
                message: `This ${field} is already registered`
            });
        }

        res.status(500).json({
            error: 'Registration failed',
            message: 'Unable to create your tea house membership'
        });
    }
});


router.post('/login', async (req, res) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Invalid credentials',
                details: error.details[0].message
            });
        }

        const { email, password } = req.body;

       
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            status: 'active' 
        }).select('+password');

        if (!user) {
            return res.status(401).json({
                error: 'Authentication failed',
                message: 'Invalid email or password'
            });
        }

        
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Authentication failed',
                message: 'Invalid email or password'
            });
        }

        
        user.lastLogin = new Date();
        await user.save();

       
        const { accessToken, refreshToken } = generateTokens(user._id, user.email, user.username);

        res.json({
            message: `Welcome back to ZenTea House, ${user.fullName}!`,
            member: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                membershipPoints: user.membershipPoints,
                membershipTier: user.membershipTier,
                preferredTeas: user.preferredTeas,
                dietaryPreferences: user.dietaryPreferences,
                discount: user.getDiscount()
            },
            tokens: {
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: 'Unable to authenticate member'
        });
    }
});

router.get('/profile', async (req, res) => {
    try {
        
        const userId = req.user?.userId; 
        
        if (!userId) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const user = await User.findById(userId)
            .populate('orders', 'orderNumber totalAmount status createdAt')
            .populate('favoriteBeverages', 'name category pricing.medium.price thumbnail');

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.json({
            member: user,
            statistics: {
                totalOrders: user.orders.length,
                currentPoints: user.membershipPoints,
                membershipTier: user.membershipTier,
                nextTierPoints: user.membershipTier === 'platinum' ? 0 : 
                    user.membershipTier === 'gold' ? 5000 - user.membershipPoints :
                    user.membershipTier === 'silver' ? 2000 - user.membershipPoints :
                    500 - user.membershipPoints
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            error: 'Unable to fetch profile'
        });
    }
});


router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                error: 'Refresh token required'
            });
        }

        
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        
        
        const user = await User.findById(decoded.userId).select('email username status');

        if (!user || user.status !== 'active') {
            return res.status(401).json({
                error: 'Invalid refresh token'
            });
        }

        const { accessToken } = generateTokens(user._id, user.email, user.username);

        res.json({
            accessToken
        });

    } catch (error) {
        res.status(401).json({
            error: 'Invalid refresh token'
        });
    }
});


router.post('/logout', (req, res) => {
    res.json({
        message: 'Thank you for visiting ZenTea House. See you again soon! 🍵'
    });
});

module.exports = router;