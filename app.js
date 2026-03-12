const API_BASE_URL = window.location.origin + '/api';

// State
let state = {
    menu: [],
    cart: [],
    orders: [],
    currentCategory: 'All',
    tableNumber: 1,
    view: 'customer' // 'customer' or 'admin'
};

// DOM Elements
const els = {
    viewCustomerBtn: document.getElementById('view-customer-btn'),
    viewAdminBtn: document.getElementById('view-admin-btn'),
    customerView: document.getElementById('customer-view'),
    adminView: document.getElementById('admin-view'),

    // Customer Elements
    menuGrid: document.getElementById('menu-grid'),
    categoryFilters: document.getElementById('category-filters'),
    tableInput: document.getElementById('table-input'),
    cartIcon: document.querySelector('.cart-icon-container'),
    cartCount: document.getElementById('cart-count'),
    cartSidebar: document.getElementById('cart-sidebar'),
    closeCartBtn: document.getElementById('close-cart-btn'),
    cartOverlay: document.getElementById('cart-overlay'),
    cartItems: document.getElementById('cart-items'),
    cartTotalAmount: document.getElementById('cart-total-amount'),
    checkoutBtn: document.getElementById('checkout-btn'),

    // Admin Elements
    refreshOrdersBtn: document.getElementById('refresh-orders-btn'),
    pendingOrdersList: document.getElementById('pending-orders-list'),
    completedOrdersList: document.getElementById('completed-orders-list'),
    statPending: document.getElementById('stat-pending'),
    statCompleted: document.getElementById('stat-completed'),

    // Global
    toastContainer: document.getElementById('toast-container')
};

// Initialization
async function init() {
    setupEventListeners();
    await fetchMenu();
    renderMenu();
}

function setupEventListeners() {
    // View switching
    els.viewCustomerBtn.addEventListener('click', () => switchView('customer'));
    els.viewAdminBtn.addEventListener('click', () => {
        switchView('admin');
        fetchOrders();
    });

    // Cart interaction
    els.cartIcon.addEventListener('click', toggleCart);
    els.closeCartBtn.addEventListener('click', toggleCart);
    els.cartOverlay.addEventListener('click', toggleCart);
    els.checkoutBtn.addEventListener('click', placeOrder);

    // Table input
    els.tableInput.addEventListener('change', (e) => {
        state.tableNumber = parseInt(e.target.value) || 1;
    });

    // Admin
    els.refreshOrdersBtn.addEventListener('click', () => {
        fetchOrders();
        showToast('Orders refreshed', 'success');
    });
}

// API Calls
async function fetchMenu() {
    try {
        const response = await fetch(`${API_BASE_URL}/menu`);
        if (!response.ok) throw new Error('Failed to fetch menu');
        state.menu = await response.json();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function fetchOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/orders`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        state.orders = await response.json();
        renderOrders();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function placeOrder() {
    if (state.cart.length === 0) return;

    els.checkoutBtn.disabled = true;
    els.checkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    const orderData = {
        table_number: state.tableNumber,
        items: state.cart.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity
        }))
    };

    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) throw new Error('Failed to place order');

        // Clear cart
        state.cart = [];
        updateCart();
        toggleCart();
        showToast('Order placed successfully!', 'success');

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        els.checkoutBtn.disabled = false;
        els.checkoutBtn.innerHTML = 'Place Order';
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (!response.ok) throw new Error('Failed to update order');

        showToast(`Order marked as ${status}`, 'success');
        fetchOrders();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Rendering Logic
function renderMenu() {
    // Render Filters
    const categories = ['All', ...new Set(state.menu.map(i => i.category))];
    els.categoryFilters.innerHTML = categories.map(cat => `
        <button class="filter-btn ${cat === state.currentCategory ? 'active' : ''}" 
                onclick="filterCategory('${cat}')">${cat}</button>
    `).join('');

    // Render Menu Items
    const filteredMenu = state.currentCategory === 'All'
        ? state.menu
        : state.menu.filter(i => i.category === state.currentCategory);

    els.menuGrid.innerHTML = filteredMenu.map(item => `
        <div class="menu-item-card">
            <img class="menu-item-img" src="${item.image_url}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="menu-item-content">
                <div class="menu-item-header">
                    <h3 class="menu-item-title">${item.name}</h3>
                    <span class="menu-item-price">$${item.price.toFixed(2)}</span>
                </div>
                <p class="menu-item-desc">${item.description}</p>
                <button class="add-to-cart-btn" onclick="addToCart('${item.id}')">
                    <i class="fa-solid fa-plus"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

window.filterCategory = function (category) {
    state.currentCategory = category;
    renderMenu();
}

// Cart Logic
window.addToCart = function (itemId) {
    const item = state.menu.find(i => i.id === itemId);
    if (!item) return;

    const existingCartItem = state.cart.find(i => i.id === itemId);
    if (existingCartItem) {
        existingCartItem.quantity += 1;
    } else {
        state.cart.push({ ...item, quantity: 1 });
    }

    updateCart();
    showToast(`Added ${item.name} to cart`, 'success');

    // Small animation on cart icon
    els.cartIcon.style.transform = 'scale(1.2)';
    setTimeout(() => { els.cartIcon.style.transform = 'scale(1)'; }, 200);
}

window.updateCartItemQty = function (itemId, delta) {
    const itemIndex = state.cart.findIndex(i => i.id === itemId);
    if (itemIndex > -1) {
        state.cart[itemIndex].quantity += delta;
        if (state.cart[itemIndex].quantity <= 0) {
            state.cart.splice(itemIndex, 1);
        }
        updateCart();
    }
}

function updateCart() {
    // Update count
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    els.cartCount.textContent = totalItems;

    // Update total amount
    const totalAmount = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    els.cartTotalAmount.textContent = `$${totalAmount.toFixed(2)}`;

    // Update Checkout button state
    els.checkoutBtn.disabled = state.cart.length === 0;

    // Render items
    if (state.cart.length === 0) {
        els.cartItems.innerHTML = '<div class="empty-cart"><i class="fa-solid fa-basket-shopping fa-3x" style="margin-bottom:1rem; opacity:0.5;"></i><p>Your cart is empty</p></div>';
        return;
    }

    els.cartItems.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateCartItemQty('${item.id}', -1)"><i class="fa-solid fa-minus"></i></button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateCartItemQty('${item.id}', 1)"><i class="fa-solid fa-plus"></i></button>
            </div>
        </div>
    `).join('');
}

function toggleCart() {
    els.cartSidebar.classList.toggle('open');
    els.cartOverlay.classList.toggle('open');
}

// Admin Logic
function renderOrders() {
    const pendingOrders = state.orders.filter(o => o.status === 'pending')
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const completedOrders = state.orders.filter(o => o.status !== 'pending')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // newest first

    els.statPending.textContent = pendingOrders.length;
    els.statCompleted.textContent = completedOrders.length;

    function createOrderHTML(order, isPending) {
        const time = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">Order <span>#${order.id.slice(0, 8)}</span></div>
                    <div class="order-table">Table ${order.table_number}</div>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem;">Placed at ${time}</div>
                <ul class="order-items-list">
                    ${order.items.map(item => `
                        <li>
                            <span><span class="order-item-qty">${item.quantity}x</span> ${item.name}</span>
                        </li>
                    `).join('')}
                </ul>
                <div class="order-footer">
                    <div class="order-total">Total: $${order.total_amount.toFixed(2)}</div>
                    ${isPending
                ? `<button class="complete-btn" onclick="updateOrderStatus('${order.id}', 'completed')">Complete Order</button>`
                : `<span class="status-badge status-${order.status}">${order.status}</span>`
            }
                </div>
            </div>
        `;
    }

    if (pendingOrders.length === 0) {
        els.pendingOrdersList.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">No pending orders</p>';
    } else {
        els.pendingOrdersList.innerHTML = pendingOrders.map(o => createOrderHTML(o, true)).join('');
    }

    if (completedOrders.length === 0) {
        els.completedOrdersList.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">No completed orders</p>';
    } else {
        els.completedOrdersList.innerHTML = completedOrders.map(o => createOrderHTML(o, false)).join('');
    }
}

// Utility
function switchView(viewName) {
    state.view = viewName;

    // Update Buttons
    els.viewCustomerBtn.classList.toggle('active', viewName === 'customer');
    els.viewAdminBtn.classList.toggle('active', viewName === 'admin');

    // Update Sections
    els.customerView.classList.toggle('active', viewName === 'customer');
    els.adminView.classList.toggle('active', viewName === 'admin');
}

window.showToast = function (message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;

    els.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

// Start app
document.addEventListener('DOMContentLoaded', init);
