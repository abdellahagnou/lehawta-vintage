const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();
const db = admin.firestore();

// Simple HTTP endpoint for health check
const app = express();
app.use(cors({ origin: true }));
app.get('/health', (req, res) => res.json({ ok: true }));

// Optional: HTTP endpoint to create an order (if you prefer server-validated writes)
app.post('/create-order', express.json(), async (req, res) => {
  try {
    const order = req.body;
    // validate basic shape
    if (!order || !Array.isArray(order.items) || typeof order.total !== 'number') {
      return res.status(400).json({ error: 'invalid_order' });
    }

    order.status = 'pending';
    order.createdAt = admin.firestore.FieldValue.serverTimestamp();

    const ref = await db.collection('orders').add(order);

    // TODO: notify admin (email / webhook) using environment variables
    // e.g. use nodemailer or third-party services (SendGrid, Twilio)

    return res.json({ id: ref.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

exports.api = functions.https.onRequest(app);

// Firestore trigger: when a new order is created, do post-processing (notify admin)
exports.onOrderCreated = functions.firestore.document('orders/{orderId}').onCreate(async (snap, ctx) => {
  const order = snap.data();
  console.log('New order', ctx.params.orderId, order);
  // Add your notification logic here (send email, webhook to admin panel, etc.)
});
