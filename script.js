const filterButtons = document.querySelectorAll('.filter-btn');
const cards = document.querySelectorAll('.card');
const cartBadge = document.querySelector('.cart-count');
const cartOverlay = document.getElementById('cart-overlay');
const cartDrawer = document.getElementById('cart-drawer');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartToggle = document.getElementById('cart-toggle');
const cartClose = document.getElementById('cart-close');
const checkoutBtn = document.getElementById('checkout-btn');

let cart = [];

function parsePrice(value) {
  const numeric = Number(String(value).replace(/[^0-9]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartBadge() {
  if (cartBadge) {
    cartBadge.textContent = String(getCartCount());
  }
}

function openCart() {
  if (cartDrawer) cartDrawer.classList.add('is-open');
  if (cartOverlay) cartOverlay.classList.add('is-open');
}

function closeCart() {
  if (cartDrawer) cartDrawer.classList.remove('is-open');
  if (cartOverlay) cartOverlay.classList.remove('is-open');
}

function renderCart() {
  if (!cartItemsEl || !cartTotalEl) return;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<div class="cart-empty">السلة فاضية. اختار القطعة اللي تحبها.</div>';
    cartTotalEl.textContent = '0 درهم';
    updateCartBadge();
    return;
  }

  let total = 0;

  cartItemsEl.innerHTML = cart.map((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    return `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-row">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-price">${itemTotal} درهم</span>
        </div>
        <div class="cart-controls">
          <div class="qty-box">
            <button type="button" data-action="decrease" data-id="${item.id}">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-action="increase" data-id="${item.id}">+</button>
          </div>
          <button class="cart-remove" type="button" data-action="remove" data-id="${item.id}">حذف</button>
        </div>
      </div>
    `;
  }).join('');

  cartTotalEl.textContent = `${total} درهم`;
  updateCartBadge();
}

function addToCart(productId, productName, price) {
  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: productId, name: productName, price, quantity: 1 });
  }

  renderCart();
  openCart();
}

function adjustItem(productId, delta) {
  cart = cart
    .map((item) => {
      if (item.id !== productId) return item;
      return { ...item, quantity: item.quantity + delta };
    })
    .filter((item) => item.quantity > 0);

  renderCart();
}

function removeItem(productId) {
  cart = cart.filter((item) => item.id !== productId);
  renderCart();
}

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach((button) => button.classList.remove('is-active'));
    btn.classList.add('is-active');

    const filter = btn.dataset.filter;

    cards.forEach((card) => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('is-hidden', !show);
    });
  });
});

// ===== رقم الواتساب ديال الهوتة =====
const whatsappNumber = '212779794263';

document.querySelectorAll('.btn-add').forEach((btn) => {
  if (btn.disabled) return;

  btn.addEventListener('click', () => {
    const card = btn.closest('.card');
    if (!card) return;

    const productId = card.dataset.productId || `product-${Math.random().toString(16).slice(2)}`;
    const productName = card.dataset.productName || card.querySelector('.card-title')?.textContent?.trim() || 'قطعة';
    const price = Number(card.dataset.price || parsePrice(card.querySelector('.card-price')?.textContent || 0));

    addToCart(productId, productName, price);
  });
});

if (cartToggle) {
  cartToggle.addEventListener('click', openCart);
}

if (cartClose) {
  cartClose.addEventListener('click', closeCart);
}

if (cartOverlay) {
  cartOverlay.addEventListener('click', closeCart);
}

cartItemsEl?.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const productId = target.dataset.id;
  const action = target.dataset.action;

  if (action === 'increase') adjustItem(productId, 1);
  if (action === 'decrease') adjustItem(productId, -1);
  if (action === 'remove') removeItem(productId);
});

if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) return;

    const itemsText = cart
      .map((item) => `${item.name} × ${item.quantity} = ${item.price * item.quantity} درهم`)
      .join('\n');

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const message = `السلام، بغيت نطلب: \n${itemsText}\n\nالمجموع: ${total} درهم`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank', 'noopener');
  });
}

// ===== تدوير صور الهيرو =====
const heroSlides = document.querySelectorAll('.hero-logo-img');
let currentSlide = 0;

if (heroSlides.length > 1) {
  setInterval(() => {
    heroSlides[currentSlide].classList.remove('is-active');
    currentSlide = (currentSlide + 1) % heroSlides.length;
    heroSlides[currentSlide].classList.add('is-active');
  }, 4000);
}

renderCart();
