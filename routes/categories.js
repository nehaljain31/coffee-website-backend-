const express = require('express');
const router = express.Router();
const Beverage = require('../models/Beverage');

// Get all unique categories
router.get('/', async (req, res) => {
    try {
        const categories = await Beverage.distinct('category');
        res.json({ categories });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
