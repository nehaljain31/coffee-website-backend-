const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: 'India' }
    },
    avatar: {
        type: String,
        default: null
    },
    
    // Tea House specific fields
    membershipTier: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
        default: 'bronze'
    },
    membershipPoints: {
        type: Number,
        default: 100
    },
    preferredTeas: [{
        type: String,
        enum: ['green', 'black', 'white', 'oolong', 'herbal', 'chai', 'matcha', 'bubble']
    }],
    dietaryPreferences: [{
        type: String,
        enum: ['vegan', 'lactose-free', 'sugar-free', 'organic', 'caffeine-free']
    }],
    
    // Orders reference
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    }],
    
    // Favorites
    favoriteBeverages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Beverage"
    }],
    
    // Reviews given by user
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review"
    }],
    
    // Account status
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    
    // Timestamps
    memberSince: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ membershipTier: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});


userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Update membership tier based on points
userSchema.methods.updateMembershipTier = function() {
    if (this.membershipPoints >= 5000) {
        this.membershipTier = 'platinum';
    } else if (this.membershipPoints >= 2000) {
        this.membershipTier = 'gold';
    } else if (this.membershipPoints >= 500) {
        this.membershipTier = 'silver';
    } else {
        this.membershipTier = 'bronze';
    }
};

// Add points method
userSchema.methods.addPoints = function(points) {
    this.membershipPoints += points;
    this.updateMembershipTier();
};

// Get discount based on membership tier
userSchema.methods.getDiscount = function() {
    const discounts = {
        bronze: 0,
        silver: 5,
        gold: 10,
        platinum: 15
    };
    return discounts[this.membershipTier] || 0;
};

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
    if (!this.address.street) return '';
    return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

// Don't return password in JSON
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model("User", userSchema);