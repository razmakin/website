// Global state
let currentUser = null;
let cart = [];

// DOM elements
// No loginBtn needed
const cartBtn = document.getElementById('cartBtn');
const authModal = document.getElementById('authModal');
const cartSidebar = document.getElementById('cartSidebar');
const productsGrid = document.getElementById('productsGrid');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  await loadProducts();
  await loadCart();
  
  setupEventListeners();
});

// No auth needed - guest checkout only
let currentUser = null; // Always guest

async function loadProducts() {
  productsGrid.innerHTML = '<div class="loading"></div>';
  
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('API failed');
    const products = await response.json();
    renderProducts(products);
  } catch (err) {
    console.log('API failed, using dummy products:', err);
    const dummyProducts = [
      {
        id: '1',
        name: 'GreenWorks 21" Push Mower',
        type: 'Push Mower',
        price: 299.99,
        description: '• Eco-friendly battery-powered\n• 21" steel deck\n• 4.0Ah battery\n• 45 min runtime',
        imageUrl: 'https://via.placeholder.com/400x300/1a3c34/ffffff?text=GreenWorks+Push'
      },
      {
        id: '2',
        name: 'John Deere X380 Riding',
        type: 'Riding Mower',
        price: 4299.99,
        description: '• 42" Accel Deep deck\n• 22HP V-Twin engine\n• Power steering\n• MulchControl system',
        imageUrl: 'https://via.placeholder.com/400x300/2d5a4a/ffffff?text=John+Deere+X380'
      },
      {
        id: '3',
        name: 'Husqvarna Automower 450XH',
        type: 'Robotic Mower',
        price: 3499.99,
        description: '• GPS navigation\n• App control\n• 1.25 acres coverage\n• Weather timer',
        imageUrl: 'https://via.placeholder.com/400x300/1a3c34/ffffff?text=Husqvarna+450XH'
      },
      {
        id: '4',
        name: 'EGO 56V 21" Self-Propelled',
        type: 'Self-Propelled',
        price: 699.99,
        description: '• 56V ARC Lithium battery\n• Touch Drive\n• LED lights\n• 7.5Ah battery',
        imageUrl: 'https://via.placeholder.com/400x300/2d5a4a/ffffff?text=EGO+Self-Propelled'
      },
      {
        id: '5',
        name: 'Toro Recycler 22" Gas',
        type: 'Gas Mower',
        price: 499.99,
        description: '• 163cc engine\n• Personal Pace\n• Bag/ Mulch\n• SmartStow storage',
        imageUrl: 'https://via.placeholder.com/400x300/1a3c34/ffffff?text=Toro+Recycler'
      },
      {
        id: '6',
        name: 'Ryobi 40V HP Brushless',
        type: 'Cordless Mower',
        price: 599.99,
        description: '• 40V HP battery\n• 6.0Ah battery\n• Cut, mulch, bag\n• 75 min runtime',
        imageUrl: 'https://via.placeholder.com/400x300/2d5a4a/ffffff?text=Ryobi+40V'
      }
    ];
    renderProducts(dummyProducts);
  }
}

function renderProducts(products) {
  productsGrid.innerHTML = products.map(product => `
    <div class="product-card">
      <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
      <div class="product-info">
        <div class="product-type">${product.type}</div>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-price">$${product.price.toFixed(2)}</div>
        <p class="product-description">${product.description}</p>
        <button class="btn btn-primary add-to-cart" 
                data-product-id="${product.id}"
                data-product-name="${product.name}"
                data-product-price="${product.price}">
          🛒 Add to Cart
        </button>
      </div>
    </div>
  `).join('');
  
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', handleAddToCartStatic);
  });
}

async function loadCart() {
  // Try backend first
  try {
    if (currentUser) {
      const response = await fetch('/api/cart');
      const data = await response.json();
      cart = data.cart || [];
    } else {
      // Load from localStorage for static mode
      const saved = localStorage.getItem('staticCart');
      cart = saved ? JSON.parse(saved) : [];
    }
  } catch (err) {
    console.log('Backend cart failed, using localStorage');
    const saved = localStorage.getItem('staticCart');
    cart = saved ? JSON.parse(saved) : [];
  }
  updateCartUI();
  updateCartCount();
}

async function handleAddToCart(e) {
  const productId = e.target.dataset.productId;
  const btn = e.target;
  
  btn.disabled = true;
  btn.textContent = 'Adding...';
  
  try {
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    
    if (response.ok) {
      await loadCart(); // Refresh cart
      btn.textContent = 'Added! ✓';
      setTimeout(() => {
        btn.textContent = '🛒 Add to Cart';
        btn.disabled = false;
      }, 2000);
    } else {
      throw new Error('Failed to add to cart');
    }
  } catch (err) {
    alert('Error adding to cart. Please try again.');
    btn.textContent = '🛒 Add to Cart';
    btn.disabled = false;
  }
}

function handleAddToCartStatic(e) {
  const productId = e.target.dataset.productId;
  const productName = e.target.dataset.productName;
  const productPrice = parseFloat(e.target.dataset.productPrice);
  const btn = e.target;
  
  btn.disabled = true;
  btn.textContent = 'Added! ✓';
  
  // Add to local cart
  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ 
      productId, 
      productName, 
      productPrice, 
      quantity: 1 
    });
  }
  
  updateCartUI();
  updateCartCount();
  
  setTimeout(() => {
    btn.textContent = '🛒 Add to Cart';
    btn.disabled = false;
  }, 2000);
}

function updateCartUI() {
  // Save to localStorage for static mode
  localStorage.setItem('staticCart', JSON.stringify(cart));
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Your cart is empty</p>';
    checkoutBtn.style.display = 'none';
    cartTotal.textContent = '0.00';
    return;
  }
  
  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <img src="${item.productId?.imageUrl || 'https://via.placeholder.com/60x60/1a3c34/fff?text=🛒'}" alt="${item.productId?.name || item.productName}">
      <div class="cart-item-info">
        <h4>${item.productId?.name || item.productName}</h4>
        <div class="cart-item-price">$${item.productId?.price?.toFixed(2) || item.productPrice.toFixed(2)}</div>
        <div class="quantity-controls">
          <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
          <span>${item.quantity}</span>
          <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
        </div>
      </div>
    </div>
  `).join('');
  
  const total = cart.reduce((sum, item) => sum + ((item.productId?.price || item.productPrice) * item.quantity), 0);
  cartTotal.textContent = total.toFixed(2);
  checkoutBtn.style.display = 'block';
}

window.updateQuantity = (index, change) => {
  cart[index].quantity = Math.max(1, cart[index].quantity + change);
  updateCartUI();
  // TODO: Save to backend
};

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartBtn.textContent = `🛒 Cart (${count})`;
}

// No auth UI
function enableCartButtons() {
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.disabled = false;
  });
}

// Event Listeners
function setupEventListeners() {
  // Auth modal
  loginBtn.addEventListener('click', () => {
    authModal.style.display = 'block';
  });
  
  // Close modal
  document.querySelector('.close').addEventListener('click', () => {
    authModal.style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === authModal) {
      authModal.style.display = 'none';
    }
  });
  
  // Cart toggle
  cartBtn.addEventListener('click', () => {
    cartSidebar.classList.toggle('open');
  });
  
  document.querySelector('.close-cart').addEventListener('click', () => {
    cartSidebar.classList.remove('open');
  });
  
  // Login form
  document.getElementById('loginForm').querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      if (data.success) {
        currentUser = data.user;
        updateUIForAuth();
        authModal.style.display = 'none';
        await loadCart();
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      alert('Login error');
    }
  });
  
  // Register form
  document.getElementById('registerForm').querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      if (data.success) {
        currentUser = data.user;
        updateUIForAuth();
        authModal.style.display = 'none';
        await loadCart();
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (err) {
      alert('Registration error');
    }
  });
  
  // Form toggle
  document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
  });
  
  document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
  });
  
  // Checkout (placeholder)
  checkoutBtn.addEventListener('click', () => {
    alert('Checkout functionality coming soon!');
  });
}

