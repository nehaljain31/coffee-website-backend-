
require('dotenv').config();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/user');
const Beverage = require('./models/Beverage');

dotenv.config(); 


const users = [
  {
    fullName: 'John Doe',
    username: 'john_doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '1234567890'
  },
  {
    fullName: 'Jane Smith',
    username: 'jane_smith',
    email: 'jane@example.com',
    password: 'securepass456',
    phone: '9876543210'
  }
];


const beverages = [
  {
    name: 'Matcha Latte',
    description: 'Smooth and vibrant green tea latte',
    category: 'matcha',
    pricing: {
      small: { price: 110 },
      medium: { price: 130 },
      large: { price: 150 }
    },
    teaOrigin: 'Uji, Japan',
    caffeineLevel: 'medium',
    brewingTemp: 80,
    brewingTime: '3 minutes',
    ingredients: ['Matcha powder', 'Milk', 'Sweetener'],
    dietaryTags: ['lactose-free'],
    thumbnail: 'https://example.com/images/matcha-latte.jpg',
    images: ['https://example.com/images/matcha-latte.jpg']
  },
  {
    name: 'Classic Chai',
    description: 'Spiced black tea brewed with milk and sugar',
    category: 'chai',
    pricing: {
      small: { price: 100 },
      medium: { price: 120 },
      large: { price: 140 }
    },
    teaOrigin: 'Assam, India',
    caffeineLevel: 'high',
    brewingTemp: 95,
    brewingTime: '5 minutes',
    ingredients: ['Black tea', 'Spices', 'Milk', 'Sugar'],
    dietaryTags: ['organic'],
    thumbnail: 'https://example.com/images/chai.jpg',
    images: ['https://example.com/images/chai.jpg']
  },
  {
    name: 'Hibiscus Cooler',
    description: 'Caffeine-free cold brew herbal infusion',
    category: 'herbal',
    pricing: {
      small: { price: 90 },
      medium: { price: 110 },
      large: { price: 130 }
    },
    teaOrigin: 'Egypt',
    caffeineLevel: 'none',
    brewingTemp: 70,
    brewingTime: '5-7 minutes',
    ingredients: ['Hibiscus petals', 'Lemon', 'Honey'],
    dietaryTags: ['vegan', 'sugar-free'],
    thumbnail: 'https://example.com/images/hibiscus.jpg',
    images: ['https://example.com/images/hibiscus.jpg']
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to DB');

    await User.deleteMany({});
    await Beverage.deleteMany({});

    await User.insertMany(users);
    await Beverage.insertMany(beverages);

    console.log('Database seeded!');
    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
