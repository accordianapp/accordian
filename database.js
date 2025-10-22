const fs = require('fs').promises;
const path = require('path');

const DB_FILE = path.join(__dirname, 'payments.json');

// Initialize database file if it doesn't exist
async function initDatabase() {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify({ payments: [] }, null, 2));
  }
}

// Read database
async function readDatabase() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { payments: [] };
  }
}

// Write database
async function writeDatabase(data) {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
  }
}

// Save a new payment
async function savePayment(paymentData) {
  await initDatabase();
  const db = await readDatabase();

  // Check if payment already exists for this user
  const existingIndex = db.payments.findIndex(p => p.userId === paymentData.userId);

  if (existingIndex !== -1) {
    // Update existing payment
    db.payments[existingIndex] = { ...db.payments[existingIndex], ...paymentData };
  } else {
    // Add new payment
    db.payments.push(paymentData);
  }

  await writeDatabase(db);
  return paymentData;
}

// Get payment by user ID
async function getPaymentByUserId(userId) {
  await initDatabase();
  const db = await readDatabase();
  return db.payments.find(p => p.userId === userId);
}

// Get payment by subscription ID
async function getPaymentBySubscriptionId(subscriptionId) {
  await initDatabase();
  const db = await readDatabase();
  return db.payments.find(p => p.subscriptionId === subscriptionId);
}

// Update payment status
async function updatePaymentStatus(userId, status) {
  await initDatabase();
  const db = await readDatabase();

  const payment = db.payments.find(p => p.userId === userId);
  if (payment) {
    payment.status = status;
    payment.updatedAt = new Date();
    await writeDatabase(db);
    return payment;
  }

  return null;
}

// Get all active payments
async function getActivePayments() {
  await initDatabase();
  const db = await readDatabase();
  return db.payments.filter(p => p.status === 'active');
}

// Get all payments
async function getAllPayments() {
  await initDatabase();
  const db = await readDatabase();
  return db.payments;
}

module.exports = {
  savePayment,
  getPaymentByUserId,
  getPaymentBySubscriptionId,
  updatePaymentStatus,
  getActivePayments,
  getAllPayments
};
