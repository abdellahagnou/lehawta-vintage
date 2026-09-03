const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Configure email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Test endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Lahwta payment server running' });
});

// Create payment intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, items, customerEmail, customerName } = req.body;

    if (!amount || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing amount or items' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'eur',
      metadata: {
        itemCount: items.length,
        customerName: customerName || 'Guest',
        items: JSON.stringify(items),
      },
      receipt_email: customerEmail,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment and send order email
app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, items, total, customerEmail, customerName } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not confirmed' });
    }

    const itemsList = items
      .map((item) => `• ${item.name} × ${item.quantity} = ${item.price * item.quantity} درهم`)
      .join('\n');

    const emailContent = `
      <h2>تم تأكيد طلبك من الهوتة</h2>
      <p>السلام عليكم ${customerName},</p>
      <p>شكراً على طلبك! إليك تفاصيل الطلب:</p>
      
      <h3>تفاصيل الطلب:</h3>
      <pre>${itemsList}</pre>
      
      <h3>المجموع: ${total} درهم</h3>
      
      <p>سيتم التواصل معك قريباً لتأكيد التفاصيل والتوصيل.</p>
      <p>شكراً لاختيارك الهوتة ❤️</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: 'تأكيد الطلب - الهوتة Vintage',
      html: emailContent,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `طلب جديد - ${customerName}`,
      html: `
        <h2>طلب جديد من ${customerName}</h2>
        <p>البريد: ${customerEmail}</p>
        <h3>الحاويج:</h3>
        <pre>${itemsList}</pre>
        <h3>المجموع: ${total} درهم</h3>
      `,
    });

    res.json({
      success: true,
      message: 'تم تأكيد الطلب وإرسال رسالة تأكيد',
    });
  } catch (error) {
    console.error('Confirmation error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Lahwta payment server running on port ${PORT}`);
});
