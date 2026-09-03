# Lahwta Payment Backend Setup

## Environment Variables

Create a `.env` file in this directory with:

```env
# Server
PORT=3001
FRONTEND_URL=http://localhost:3000

# Stripe API Keys (get from https://stripe.com/dashboard)
STRIPE_SECRET_KEY=sk_test_... (your test secret key)
STRIPE_WEBHOOK_SECRET=whsec_... (optional, for webhooks)

# Email Configuration (Gmail example)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
ADMIN_EMAIL=admin@lehawta.com
```

## Setup Instructions

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create `.env` file with your Stripe & email credentials

3. Run the server:
   ```bash
   npm start
   ```

4. Test the server:
   ```
   http://localhost:3001/api/health
   ```

## API Endpoints

### Create Payment Intent
```
POST /api/create-payment-intent

Body:
{
  "amount": 450,
  "items": [
    { "name": "قفطان مطرز", "price": 450, "quantity": 1 }
  ],
  "customerEmail": "customer@example.com",
  "customerName": "محمد"
}

Response:
{
  "clientSecret": "pi_...",
  "paymentIntentId": "pi_..."
}
```

### Confirm Payment
```
POST /api/confirm-payment

Body:
{
  "paymentIntentId": "pi_...",
  "items": [...],
  "total": 450,
  "customerEmail": "customer@example.com",
  "customerName": "محمد"
}

Response:
{
  "success": true,
  "message": "تم تأكيد الطلب وإرسال رسالة تأكيد"
}
```

## Getting Stripe Keys

1. Go to https://stripe.com
2. Create account (free sandbox available)
3. Go to Dashboard → API keys
4. Copy test secret key (starts with `sk_test_`)
5. Paste in `.env` file

## Gmail Setup

1. Enable 2-Factor Authentication on Gmail
2. Generate App-specific password: https://myaccount.google.com/apppasswords
3. Use that password in `.env`

---

**Note:** This is a minimal setup for Lahwta. For production, add:
- Database (MongoDB) to store orders
- Error logging
- Rate limiting
- Security headers
