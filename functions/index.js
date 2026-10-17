const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();
const db = admin.firestore();

function normalizeOrder(order) {
  if (!order || typeof order !== 'object') {
    return null;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  if (items.length === 0) {
    return null;
  }

  const sanitizedItems = items
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const name = typeof item.name === 'string' ? item.name.trim() : '';
      const id = typeof item.id === 'string' ? item.id.trim() : '';
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (!name || !id || !Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(price) || price < 0) {
        return null;
      }

      return {
        id,
        name,
        price,
        quantity
      };
    })
    .filter(Boolean);

  if (sanitizedItems.length === 0) {
    return null;
  }

  const total = Number(order.total);
  const computedTotal = sanitizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!Number.isFinite(total) || total < 0 || total !== computedTotal) {
    return null;
  }

  const message = typeof order.message === 'string' ? order.message.trim().slice(0, 2000) : '';
  const source = typeof order.source === 'string' ? order.source.trim() : 'website';

  return {
    items: sanitizedItems,
    total: computedTotal,
    message,
    status: 'pending',
    source,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

// Simple HTTP endpoint for health check
const app = express();
app.use(cors({ origin: true }));
app.get('/health', (req, res) => res.json({ ok: true }));

// Optional: HTTP endpoint to create an order (if you prefer server-validated writes)
app.post('/create-order', express.json(), async (req, res) => {
  try {
    const order = normalizeOrder(req.body);

    if (!order) {
      return res.status(400).json({ error: 'invalid_order' });
    }

    const ref = await db.collection('orders').add(order);

    // TODO: notify admin (email / webhook) using environment variables
    // e.g. use nodemailer or third-party services (SendGrid, Twilio)

    return res.status(201).json({ id: ref.id });
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
