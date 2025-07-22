const mongoose = require('mongoose');

const beverageSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    category: {
        type: String,
        required: true,
        enum: ['green-tea', 'black-tea', 'white-tea', 'oolong', 'herbal', 'chai', 'matcha', 'bubble-tea', 'cold-brew', 'seasonal-special']
    },
    
    // Pricing for different sizes
    pricing: {
        small: {
            price: { type: Number, required: true },
            size: { type: String, default: '8 oz' }
        },
        medium: {
            price: { type: Number, required: true },
            size: { type: String, default: '12 oz' }
        },
        large: {
            price: { type: Number, required: true },
            size: { type: String, default: '16 oz' }
        }
    },
    

    teaOrigin: {
        type: String,
        trim: true 
    },
    caffeineLevel: {
        type: String,
        enum: ['none', 'low', 'medium', 'high'],
        default: 'medium'
    },
    brewingTemp: {
        type: Number, 
        min: 60,
        max: 100
    },
    brewingTime: {
        type: String, 
        trim: true
    },
    

    ingredients: [String],
    allergens: [{
        type: String,
        enum: ['dairy', 'nuts', 'soy', 'gluten', 'eggs']
    }],
    
    
    dietaryTags: [{
        type: String,
        enum: ['vegan', 'lactose-free', 'sugar-free', 'organic', 'fair-trade', 'caffeine-free']
    }],
    
    // Images
    images: [String], 
    thumbnail: String, 
    
    // Availability
    isAvailable: {
        type: Boolean,
        default: true
    },
    isSeasonalSpecial: {
        type: Boolean,
        default: false
    },
    seasonalStartDate: Date,
    seasonalEndDate: Date,
    
   
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review"
    }],
    
    
    customizationOptions: {
        milkOptions: [{
            name: String, 
            additionalPrice: { type: Number, default: 0 }
        }],
        sweetenerOptions: [{
            name: String, 
            additionalPrice: { type: Number, default: 0 }
        }],
        extraOptions: [{
            name: String, 
            additionalPrice: Number
        }]
    },
    
   
    nutrition: {
        calories: Number,
        protein: Number, 
        carbs: Number,
        fat: Number,
        sugar: Number,
        sodium: Number 
    },
    
    
    preparationNotes: {
        type: String,
        maxlength: 300
    },
    
    // Inventory
    stockQuantity: {
        type: Number,
        default: 0
    },
    lowStockThreshold: {
        type: Number,
        default: 10
    },
    
    // Marketing
    isPopular: {
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    tags: [String], 
    
}, {
    timestamps: true
});


beverageSchema.index({ category: 1 });
beverageSchema.index({ isAvailable: 1 });
beverageSchema.index({ averageRating: -1 });
beverageSchema.index({ name: 'text', description: 'text', tags: 'text' });


beverageSchema.virtual('isLowStock').get(function() {
    return this.stockQuantity <= this.lowStockThreshold;
});


beverageSchema.virtual('isCurrentlySeasonalActive').get(function() {
    if (!this.isSeasonalSpecial) return false;
    
    const now = new Date();
    return (!this.seasonalStartDate || now >= this.seasonalStartDate) && 
           (!this.seasonalEndDate || now <= this.seasonalEndDate);
});


beverageSchema.methods.calculatePrice = function(size, customizations = []) {
    let basePrice = this.pricing[size]?.price || this.pricing.medium.price;
    
    
    customizations.forEach(custom => {
        if (custom.type === 'milk' && this.customizationOptions.milkOptions) {
            const milkOption = this.customizationOptions.milkOptions.find(m => m.name === custom.name);
            if (milkOption) basePrice += milkOption.additionalPrice;
        }
        
    });
    
    return basePrice;
};


beverageSchema.methods.updateAverageRating = async function() {
    const Review = mongoose.model('Review');
    const stats = await Review.aggregate([
        { $match: { beverage: this._id } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);
    
    if (stats.length > 0) {
        this.averageRating = Math.round(stats[0].averageRating * 10) / 10;
        this.totalReviews = stats[0].totalReviews;
    } else {
        this.averageRating = 0;
        this.totalReviews = 0;
    }
    
    await this.save();
};

module.exports = mongoose.model("Beverage", beverageSchema);