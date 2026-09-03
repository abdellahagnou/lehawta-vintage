// Payment Module for Lahwta
// This handles Stripe payments alongside WhatsApp checkout

class LahwtaPayment {
  constructor(stripePublicKey, backendUrl = 'http://localhost:3001') {
    this.stripePublicKey = stripePublicKey;
    this.backendUrl = backendUrl;
    this.stripe = null;
    this.elements = null;
    this.cardElement = null;
    this.paymentIntent = null;
    this.init();
  }

  async init() {
    // Load Stripe.js
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => this.setupStripe();
    document.head.appendChild(script);

    this.setupEventListeners();
  }

  setupStripe() {
    this.stripe = Stripe(this.stripePublicKey);
    this.elements = this.stripe.elements({
      locale: 'ar', // RTL support
    });

    // Create card element
    this.cardElement = this.elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#f8f1e7',
          '::placeholder': {
            color: '#d5c3a4',
          },
        },
        invalid: {
          color: '#dc3545',
        },
      },
    });

    const cardElementContainer = document.getElementById('card-element');
    if (cardElementContainer) {
      this.cardElement.mount('#card-element');
      this.cardElement.on('change', (event) => {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
          displayError.textContent = event.error.message;
        } else {
          displayError.textContent = '';
        }
      });
    }
  }

  setupEventListeners() {
    // Payment method modal open/close
    const paymentCheckout = document.getElementById('checkout-btn');
    if (paymentCheckout) {
      paymentCheckout.addEventListener('click', () => this.openPaymentModal());
    }

    const paymentModalClose = document.getElementById('payment-modal-close');
    if (paymentModalClose) {
      paymentModalClose.addEventListener('click', () => this.closePaymentModal());
    }

    const paymentModalOverlay = document.getElementById('payment-modal-overlay');
    if (paymentModalOverlay) {
      paymentModalOverlay.addEventListener('click', () => this.closePaymentModal());
    }

    // Payment method selection
    const stripeBtn = document.getElementById('stripe-payment-btn');
    if (stripeBtn) {
      stripeBtn.addEventListener('click', () => this.selectStripePayment());
    }

    const whatsappBtn = document.getElementById('whatsapp-payment-btn');
    if (whatsappBtn) {
      whatsappBtn.addEventListener('click', () => this.selectWhatsAppPayment());
    }

    // Stripe form
    const stripeForm = document.getElementById('stripe-payment-form');
    if (stripeForm) {
      stripeForm.addEventListener('submit', (e) => this.handleStripePayment(e));
    }

    const stripeFormClose = document.getElementById('stripe-form-close');
    if (stripeFormClose) {
      stripeFormClose.addEventListener('click', () => this.closeStripeForm());
    }

    const stripeFormOverlay = document.getElementById('stripe-modal-overlay');
    if (stripeFormOverlay) {
      stripeFormOverlay.addEventListener('click', () => this.closeStripeForm());
    }
  }

  openPaymentModal() {
    const modal = document.getElementById('payment-modal');
    const overlay = document.getElementById('payment-modal-overlay');
    if (modal) {
      modal.setAttribute('aria-hidden', 'false');
      modal.classList.add('is-open');
    }
    if (overlay) {
      overlay.classList.add('is-open');
    }
  }

  closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    const overlay = document.getElementById('payment-modal-overlay');
    if (modal) {
      modal.setAttribute('aria-hidden', 'true');
      modal.classList.remove('is-open');
    }
    if (overlay) {
      overlay.classList.remove('is-open');
    }
  }

  openStripeForm() {
    const modal = document.getElementById('stripe-form-modal');
    const overlay = document.getElementById('stripe-modal-overlay');
    if (modal) {
      modal.setAttribute('aria-hidden', 'false');
      modal.classList.add('is-open');
    }
    if (overlay) {
      overlay.classList.add('is-open');
    }
  }

  closeStripeForm() {
    const modal = document.getElementById('stripe-form-modal');
    const overlay = document.getElementById('stripe-modal-overlay');
    if (modal) {
      modal.setAttribute('aria-hidden', 'true');
      modal.classList.remove('is-open');
    }
    if (overlay) {
      overlay.classList.remove('is-open');
    }
  }

  selectStripePayment() {
    this.closePaymentModal();
    this.openStripeForm();
    this.populateOrderSummary();
  }

  selectWhatsAppPayment() {
    this.closePaymentModal();
    // Use existing WhatsApp checkout logic
    if (window.checkoutBtn) {
      window.checkoutBtn.click();
    }
  }

  populateOrderSummary() {
    const itemsContainer = document.getElementById('stripe-order-items');
    const totalElement = document.getElementById('stripe-total');

    if (!itemsContainer || !cart || cart.length === 0) return;

    let total = 0;
    itemsContainer.innerHTML = cart.map((item) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      return `
        <div class="item-row">
          <span>${item.name} × ${item.quantity}</span>
          <span>${itemTotal} درهم</span>
        </div>
      `;
    }).join('');

    totalElement.textContent = `${total} درهم`;
  }

  async handleStripePayment(e) {
    e.preventDefault();

    if (!this.stripe || !this.cardElement || !cart || cart.length === 0) {
      alert('خطأ في البيانات');
      return;
    }

    const customerName = document.getElementById('customer-name').value;
    const customerEmail = document.getElementById('customer-email').value;
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Show loading state
    const submitBtn = document.getElementById('stripe-submit');
    const submitText = document.getElementById('stripe-submit-text');
    const submitLoading = document.getElementById('stripe-submit-loading');

    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitLoading.style.display = 'inline';

    try {
      // Step 1: Create payment intent on backend
      const response = await fetch(`${this.backendUrl}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          items: cart,
          customerEmail,
          customerName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = await response.json();

      // Step 2: Confirm payment with Stripe
      const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.cardElement,
          billing_details: {
            name: customerName,
            email: customerEmail,
          },
        },
      });

      if (error) {
        alert(`خطأ في الدفع: ${error.message}`);
        submitBtn.disabled = false;
        submitText.style.display = 'inline';
        submitLoading.style.display = 'none';
        return;
      }

      // Step 3: Confirm on backend
      if (paymentIntent.status === 'succeeded') {
        const confirmResponse = await fetch(`${this.backendUrl}/api/confirm-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            items: cart,
            total,
            customerEmail,
            customerName,
          }),
        });

        if (confirmResponse.ok) {
          // Success! Clear cart and show confirmation
          cart = []; // Clear the cart
          if (window.renderCart) {
            window.renderCart(); // Re-render cart UI
          }

          alert('✅ تم قبول طلبك! سنتواصل معك قريباً.');
          this.closeStripeForm();
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(`خطأ: ${error.message}`);
    } finally {
      submitBtn.disabled = false;
      submitText.style.display = 'inline';
      submitLoading.style.display = 'none';
    }
  }
}

// Initialize payment system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Get Stripe public key from your .env or configuration
  const stripePublicKey = 'pk_test_your_key_here'; // Replace with your Stripe test key
  const backendUrl = 'http://localhost:3001';

  window.lahwtaPayment = new LahwtaPayment(stripePublicKey, backendUrl);
});
