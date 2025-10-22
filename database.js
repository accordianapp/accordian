const fs = require('fs').promises;
const path = require('path');

const DB_FILE = path.join(__dirname, 'payments.json');

// Initialize database file if it doesn't exist
async function initDatabase() {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify({
      connectedAccounts: [],
      payments: []
    }, null, 2));
  }
}

// Read database
async function readDatabase() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { connectedAccounts: [], payments: [] };
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

// ===== CONNECTED ACCOUNTS FUNCTIONS =====

// Save or update a connected account
async function saveConnectedAccount(accountData) {
  await initDatabase();
  const db = await readDatabase();

  const existingIndex = db.connectedAccounts.findIndex(
    a => a.guildId === accountData.guildId
  );

  if (existingIndex !== -1) {
    db.connectedAccounts[existingIndex] = {
      ...db.connectedAccounts[existingIndex],
      ...accountData,
      updatedAt: new Date().toISOString()
    };
  } else {
    db.connectedAccounts.push({
      ...accountData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  await writeDatabase(db);
  return accountData;
}

// Get connected account by guild ID
async function getConnectedAccountByGuildId(guildId) {
  await initDatabase();
  const db = await readDatabase();
  return db.connectedAccounts.find(a => a.guildId === guildId);
}

// Get connected account by Stripe account ID
async function getConnectedAccountByStripeId(stripeAccountId) {
  await initDatabase();
  const db = await readDatabase();
  return db.connectedAccounts.find(a => a.stripeAccountId === stripeAccountId);
}

// Get all connected accounts
async function getAllConnectedAccounts() {
  await initDatabase();
  const db = await readDatabase();
  return db.connectedAccounts || [];
}

// Delete connected account
async function deleteConnectedAccount(guildId) {
  await initDatabase();
  const db = await readDatabase();
  db.connectedAccounts = db.connectedAccounts.filter(a => a.guildId !== guildId);
  await writeDatabase(db);
}

module.exports = {
  savePayment,
  getPaymentByUserId,
  getPaymentBySubscriptionId,
  updatePaymentStatus,
  getActivePayments,
  getAllPayments,
  saveConnectedAccount,
  getConnectedAccountByGuildId,
  getConnectedAccountByStripeId,
  getAllConnectedAccounts,
  deleteConnectedAccount
};
