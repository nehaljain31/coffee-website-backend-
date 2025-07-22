const mongoose = require('mongoose');
require('dotenv').config();


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tea_house_db';

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📦 Database: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};


mongoose.connection.on('connected', () => {
    console.log('🍵 ZenTea House database connected successfully');
});

mongoose.connection.on('error', (err) => {
    console.error('Database error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Database disconnected');
});


process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Database connection closed through app termination');
    process.exit(0);
});

module.exports = connectDB;