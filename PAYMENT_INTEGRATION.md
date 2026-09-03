# 🛒 Lahwta Stripe Payment Integration Guide

## Overview

This guide shows how to add **Stripe payment processing** to your existing Lahwta store while keeping the WhatsApp checkout option.

**What You Get:**
- ✅ Real online payment (Stripe)
- ✅ Customer can choose: Pay with card OR Order via WhatsApp
- ✅ Order confirmation emails
- ✅ Keep existing design & WhatsApp functionality
- ✅ No breaking changes to current code

---

## Step 1: Setup Backend (Payment Server)

### 1.1 Navigate to backend folder
```bash
cd C:\Users\HP\lehawta\backend
npm install
```

### 1.2 Create `.env` file
Create a file named `.env` in the `backend` folder:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000

# Get these from https://stripe.com/dashboard
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Gmail configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@lehawta.com
```

**Getting Stripe Keys:**
1. Go to https://stripe.com
2. Create free account
3. Dashboard → API Keys → Copy test secret key
4. Paste in `.env` as `STRIPE_SECRET_KEY`

**Getting Gmail App Password:**
1. Enable 2FA on Gmail
2. Go to https://myaccount.google.com/apppasswords
3. Generate app-specific password
4. Paste in `.env` as `EMAIL_PASSWORD`

### 1.3 Start backend server
```bash
npm start
```

Output should be:
```
✅ Lahwta payment server running on port 3001
```

---

## Step 2: Update Frontend (Your index.html)

### 2.1 Add payment modal HTML

Find this line in `index.html`:
```html
<script src="script.js"></script>
</body>
```

**BEFORE** that closing `</body>`, add:
```html
<!-- Payment Modals -->
<!-- Copy entire content from payment-modals.html and paste it here -->

<!-- Then add Stripe.js library -->
<script src="https://js.stripe.com/v3/"></script>

<!-- Your existing scripts -->
<script src="script.js"></script>

<!-- Payment handling -->
<script src="payment.js"></script>
</body>
```

### 2.2 Add payment styles

In `<head>` section of `index.html`, add:
```html
<link rel="stylesheet" href="payment-styles.css">
```

### 2.3 Update checkout button behavior

In `script.js`, find the section with:
```javascript
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    // WhatsApp checkout logic
  });
}
```

**Replace it with:**
```javascript
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    // Open payment method selection modal instead
    if (window.lahwtaPayment) {
      window.lahwtaPayment.openPaymentModal();
    }
  });
}
```

---

## Step 3: Configure Stripe Public Key

In `payment.js`, find this line:
```javascript
const stripePublicKey = 'pk_test_your_key_here';
```

Replace with your Stripe **public test key** (from Dashboard → API Keys):
```javascript
const stripePublicKey = 'pk_test_YOUR_ACTUAL_KEY_HERE';
```

---

## Step 4: Update Checkout Button Text

In `index.html`, you can change:
```html
<button class="checkout-btn" id="checkout-btn">إرسال الطلب النهائي</button>
```

To:
```html
<button class="checkout-btn" id="checkout-btn">إكمال الشراء</button>
```

(Or keep it as is - the modal will show payment options)

---

## File Structure After Setup

```
lehawta/
├── index.html                 (UPDATE: add payment modals)
├── style.css                  (existing)
├── script.js                  (UPDATE: modify checkout behavior)
├── payment.js                 (NEW: copy from here)
├── payment-styles.css         (NEW: copy from here)
├── payment-modals.html        (NEW: copy content to index.html)
├── logo.svg
├── .git/
├── logo-preview.html
└── backend/                   (NEW)
    ├── server.js
    ├── package.json
    ├── .env                   (NEW: create with your keys)
    └── README.md
```

---

## Testing the Integration

### Test Flow:
1. ✅ Backend running: `http://localhost:3001/api/health`
2. ✅ Frontend running: `http://localhost:3000` (or wherever you serve it)
3. ✅ Add items to cart
4. ✅ Click "إكمال الشراء" (Checkout)
5. ✅ Choose payment method:
   - **Pay with Card**: Fill form → Enter test card
   - **Order via WhatsApp**: Uses existing WhatsApp flow

### Test Card Numbers (Stripe):
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

Expiry: Any future date (e.g., `12/25`)
CVC: Any 3 digits (e.g., `123`)

---

## How It Works

### User Clicks "Checkout":
1. Cart review modal opens
2. Two options appear:
   - 💳 **Pay with Card** (Stripe)
   - 💬 **Order via WhatsApp**

### Stripe Payment Flow:
1. User enters name & email
2. Enters card details
3. Backend creates payment intent with Stripe
4. Frontend confirms payment with Stripe
5. If successful:
   - Backend sends order confirmation email
   - Cart clears
   - Success message appears

### WhatsApp Flow:
1. (Same as before) Pre-filled message
2. Opens WhatsApp app

---

## What Gets Sent to Customer Email

```
تم تأكيد طلبك من الهوتة

السلام عليكم محمد,

شكراً على طلبك! إليك تفاصيل الطلب:

تفاصيل الطلب:
• قفطان مطرز × 1 = 450 درهم
• بلغة جلد × 1 = 150 درهم

المجموع: 600 درهم

سيتم التواصل معك قريباً لتأكيد التفاصيل والتوصيل.

شكراً لاختيارك الهوتة ❤️
```

---

## Troubleshooting

### Backend won't start
- Check `.env` has all required fields
- Verify port 3001 is not in use
- Try: `npx kill-port 3001` then `npm start`

### Stripe payment fails
- Verify public/secret keys are correct
- Check if card element is loading (check browser console)
- Make sure backend is running (`localhost:3001`)

### Email not sending
- Verify Gmail app password (not regular password)
- Check if 2FA is enabled on Gmail
- Try with a different Gmail account

### CORS errors
- Make sure `FRONTEND_URL` in `.env` matches where you're running the site
- Default: `http://localhost:3000`

---

## Next Steps

### For Production:
1. Get live Stripe keys (not test keys)
2. Update `STRIPE_PUBLIC_KEY` and `STRIPE_SECRET_KEY`
3. Use real Gmail or email service
4. Deploy backend to Heroku/Railway/Render
5. Update `backendUrl` in `payment.js`
6. Add HTTPS certificates

### Optional Enhancements:
- Add order history
- Save customer preferences
- Add discount codes
- SMS notifications
- Order tracking

---

## Support

Check the three files:
- `backend/README.md` - Backend setup details
- `payment.js` - Client-side payment logic
- `payment-modals.html` - UI structure

Questions? Check browser console for errors!

---

**Your Lahwta store now accepts real payments! 🎉**
