// Global state
let currentUser = null;
let cart = [];

// DOM elements
const loginBtn = document.getElementById('loginBtn');
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

async function checkAuth() {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();
    if (data.loggedIn) {
      currentUser = data;
      updateUIForAuth();
    }
  } catch (err) {
    console.error('Auth check failed:', err);
  }
}

async function loadProducts() {
  try {
    productsGrid.innerHTML = '<div class="loading" style="grid-column: 1/-1; justify-self: center; align-self: center;"></div>';
    const response = await fetch('/api/products');
    const products = await response.json();
    
    productsGrid.innerHTML = products.map(product => `
      <div class="product-card">
        <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
        <div class="product-info">
          <div class="product-type">${product.type}</div>
          <h3 class="product-name">${product.name}</h3>
          <div class="product-price">$${product.price.toFixed(2)}</div>
          <p class="product-description">${product.description}</p>
          <button class="btn btn-primary add-to-cart" 
                  data-product-id="${product._id}"
                  ${!currentUser ? 'disabled' : ''}>
            ${currentUser ? '🛒 Add to Cart' : 'Login to Buy'}
          </button>
        </div>
      </div>
    `).join('');
    
    // Re-attach event listeners
    document.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', handleAddToCart);
    });
  } catch (err) {
    productsGrid.innerHTML = '<p>Error loading products. Please refresh.</p>';
    console.error('Load products failed:', err);
  }
}

async function loadCart() {
  if (!currentUser) {
    cart = [];
    updateCartUI();
    return;
  }
  
  try {
    const response = await fetch('/api/cart');
    const data = await response.json();
    cart = data.cart || [];
    updateCartUI();
    updateCartCount();
  } catch (err) {
    console.error('Load cart failed:', err);
  }
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

function updateCartUI() {
  if (cart.length === 0) {
    cartItems.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Your cart is empty</p>';
    checkoutBtn.style.display = 'none';
    cartTotal.textContent = '0.00';
    return;
  }
  
  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <img src="${item.productId.imageUrl}" alt="${item.productId.name}">
      <div class="cart-item-info">
        <h4>${item.productId.name}</h4>
        <div class="cart-item-price">$${item.productId.price.toFixed(2)}</div>
        <div class="quantity-controls">
          <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
          <span>${item.quantity}</span>
          <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
        </div>
      </div>
    </div>
  `).join('');
  
  const total = cart.reduce((sum, item) => sum + (item.productId.price * item.quantity), 0);
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

function updateUIForAuth() {
  loginBtn.textContent = `Welcome, ${currentUser.username}`;
  loginBtn.className = 'btn btn-secondary';
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.disabled = false;
    btn.textContent = '🛒 Add to Cart';
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

