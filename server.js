require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lawnmowerdb')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Seed products if none exist
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const sampleProducts = [
      {
        name: 'GreenWorks Push Mower',
        type: 'Push',
        price: 299.99,
        imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop',
        description: 'Eco-friendly push mower with 21" cutting deck'
      },
      {
        name: 'John Deere Riding Mower',
        type: 'Riding',
        price: 2499.99,
        imageUrl: 'https://images.unsplash.com/photo-1586952575587-8108bbff9b98?w=400&h=300&fit=crop',
        description: '42" riding mower with powerful 22HP engine'
      },
      {
        name: 'Husqvarna Robotic Mower',
        type: 'Robotic',
        price: 1799.99,
        imageUrl: 'https://images.unsplash.com/photo-1627322705593-e3c82f4969ec?w=400&h=300&fit=crop',
        description: 'Automated robotic mower with GPS navigation'
      }
    ];
    await Product.insertMany(sampleProducts);
    console.log('Sample products seeded');
  }
}).catch(err => console.error('MongoDB connection error:', err));

// API Routes

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register user
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email, password });
    await user.save();
    
    req.session.userId = user._id;
    res.json({ success: true, user: { id: user._id, username } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.userId = user._id;
    res.json({ success: true, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user info
app.get('/api/user', (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true, userId: req.session.userId });
  } else {
    res.json({ loggedIn: false });
  }
});

// Add to cart
app.post('/api/cart/add', async (req, res) => {
  try {
    const { productId } = req.body;
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not logged in' });
    }
    
    let cart = await Cart.findOne({ userId: req.session.userId });
    if (!cart) {
      cart = new Cart({ userId: req.session.userId, products: [] });
    }
    
    const existingItem = cart.products.find(item => item.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.products.push({ productId, quantity: 1 });
    }
    
    await cart.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get cart
app.get('/api/cart', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({ cart: [] });
    }
    
    const cart = await Cart.findOne({ userId: req.session.userId }).populate('products.productId');
    res.json({ cart: cart ? cart.products : [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create guest order
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, customerEmail, items, total } = req.body;
    
    // Validate required fields
    if (!customerName || !customerEmail || !items || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const order = new Order({
      customerName,
      customerEmail,
      items: Array.isArray(items) ? items : [],
      total: parseFloat(total)
    });
    
    await order.save();
    
    res.json({ success: true, orderId: order._id });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

