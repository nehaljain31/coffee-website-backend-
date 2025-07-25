const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  beverage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Beverage',
    required: true
  },
  user: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', reviewSchema);
