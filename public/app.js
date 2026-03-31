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
  loadProducts();
  loadCart();
  enableCartButtons(); // Enable add to cart
  setupEventListeners();
});

// Guest checkout only - no auth
currentUser = null;

// No auth needed - guest checkout only

async function loadProducts() {
  productsGrid.innerHTML = '<div class="loading"></div>';
  
  // Use dummy products directly - no API call
  const dummyProducts = [
      {
        id: '1',
        name: 'GreenWorks 21" Push Mower',
        type: 'Push Mower',
        price: 299.99,
        description: '• Eco-friendly battery-powered\n• 21" steel deck\n• 4.0Ah battery\n• 45 min runtime',
        imageUrl: '/images/products/greenworks.jpg'
      },
      {
        id: '2',
        name: 'John Deere X380 Riding',
        type: 'Riding Mower',
        price: 4299.99,
        description: '• 42" Accel Deep deck\n• 22HP V-Twin engine\n• Power steering\n• MulchControl system',
        imageUrl: '/images/products/john-deere.jpg'
      },
      {
        id: '3',
        name: 'Husqvarna Automower 450XH',
        type: 'Robotic Mower',
        price: 3499.99,
        description: '• GPS navigation\n• App control\n• 1.25 acres coverage\n• Weather timer',
        imageUrl: '/images/products/husqvarna.jpg'
      },
      {
        id: '4',
        name: 'EGO 56V 21" Self-Propelled',
        type: 'Self-Propelled',
        price: 699.99,
        description: '• 56V ARC Lithium battery\n• Touch Drive\n• LED lights\n• 7.5Ah battery',
        imageUrl: '/images/products/ego.jpg'
      },
      {
        id: '5',
        name: 'Toro Recycler 22" Gas',
        type: 'Gas Mower',
        price: 499.99,
        description: '• 163cc engine\n• Personal Pace\n• Bag/ Mulch\n• SmartStow storage',
        imageUrl: '/images/products/toro.jpg'
      },
      {
        id: '6',
        name: 'Ryobi 40V HP Brushless',
        type: 'Cordless Mower',
        price: 599.99,
        description: '• 40V HP battery\n• 6.0Ah battery\n• Cut, mulch, bag\n• 75 min runtime',
        imageUrl: '/images/products/ryobi.jpg'
      }
    ];
    renderProducts(dummyProducts);
  }


function renderProducts(products) {
  productsGrid.innerHTML = products.map(product => `
    <div class="product-card">
      <div class="product-no-image"></div>
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
  // LocalStorage cart (guest mode)
  const saved = localStorage.getItem('staticCart');
  cart = saved ? JSON.parse(saved) : [];
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
  
  // Update counter first (even if empty)
  updateCartCount();
  
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

// Event Listeners - Guest Checkout
function setupEventListeners() {
  // Cart toggle
  cartBtn.addEventListener('click', () => {
    cartSidebar.classList.toggle('open');
  });
  
  document.querySelector('.close-cart').addEventListener('click', () => {
    cartSidebar.classList.remove('open');
  });
  
  // Checkout
  checkoutBtn.addEventListener('click', () => {
    document.getElementById('checkoutModal').style.display = 'block';
  });
  
  // Close checkout modal
  document.querySelector('.close-checkout').addEventListener('click', () => {
    document.getElementById('checkoutModal').style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    const checkoutModal = document.getElementById('checkoutModal');
    if (e.target === checkoutModal) {
      checkoutModal.style.display = 'none';
    }
  });
  
  // Checkout form
  document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const customerName = document.getElementById('customerName').value;
    const customerEmail = document.getElementById('customerEmail').value;
    const submitBtn = document.getElementById('submitOrder');
    const orderStatus = document.getElementById('orderStatus');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    
    try {
      // Transform cart items to match Order schema (price field, not productPrice)
      const orderItems = cart.map(item => ({
        productName: item.productName,
        price: item.productPrice,
        quantity: item.quantity
      }));
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          items: orderItems,
          total: parseFloat(document.getElementById('cartTotal').textContent)
        })
      });
      
      const data = await response.json();
      if (data.success) {
        orderStatus.textContent = `Order #${data.orderId} placed successfully!`;
        orderStatus.style.color = 'green';
        cart = [];
        localStorage.removeItem('staticCart');
        updateCartUI();
        setTimeout(() => {
          document.getElementById('checkoutModal').style.display = 'none';
        }, 3000);
      } else {
        throw new Error(data.error || 'Order failed');
      }
    } catch (err) {
      console.error('Order error:', err);
      orderStatus.textContent = 'Order failed. Please try again.';
      orderStatus.style.color = 'red';
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place Order';
  });
}

