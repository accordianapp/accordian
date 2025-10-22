# Stripe Connect Platform Guide

This guide explains how your Discord payment bot now works as a SaaS platform where you earn 3% on every transaction processed by server owners.

---

## 🎯 How It Works

**Your Business Model:**
- Server owners use your bot to accept payments in their Discord servers
- Payments go to their Stripe account (they receive 97% minus Stripe fees)
- You automatically receive 3% platform fee on every transaction
- Everything is automated through Stripe Connect

**Example Transaction Flow:**
```
Customer pays $100
├─ Stripe fee (2.9% + $0.30): -$3.20
├─ Your platform fee (3%): -$3.00
└─ Server owner receives: $93.80
```

---

## 📋 What Changed

### New Features Added:

1. **Multi-Tenant Architecture**
   - Each Discord server connects their own Stripe account
   - Database tracks multiple connected accounts
   - Payments are routed to the correct server owner

2. **Stripe Connect Onboarding**
   - Server owners can connect their Stripe account via `/setup-stripe` command
   - Automated onboarding through Stripe's secure process
   - No manual setup required

3. **Automatic Payment Splitting**
   - One-time payments: 3% platform fee deducted automatically
   - Subscriptions: 3% recurring platform fee each month
   - Server owners receive payouts directly from Stripe

4. **Admin Dashboard**
   - `/platform-stats` command shows your revenue across all servers
   - Track connected accounts, total payments, and MRR
   - Only works for administrators

5. **Status Monitoring**
   - `/stripe-status` command for server owners to check their connection
   - Real-time updates when accounts are verified

---

## 🚀 Setup Instructions

### Step 1: Enable Stripe Connect (Already Done ✅)

You've already enabled Stripe Connect in test mode. When ready for production:

1. Go to https://dashboard.stripe.com
2. Switch to Live mode
3. Enable Connect
4. Fill out platform information

### Step 2: Test the System

**Testing locally with ngrok:**

1. Start ngrok:
   ```bash
   cd ~/Documents/discord-payment-bot
   ./ngrok http 3000
   ```

2. Start the bot:
   ```bash
   npm start
   ```

3. In Discord, run: `/setup-stripe`
   - This will give you a Stripe Connect onboarding link
   - Complete the onboarding (use test data)
   - Stripe will verify the account

4. Have a test user join your server
   - Bot sends welcome DM with role options
   - User selects a tier and payment option
   - Payment goes through with automatic 3% fee

5. Check your platform revenue:
   ```
   /platform-stats
   ```

### Step 3: Deploy to Railway

Follow the existing DEPLOYMENT_GUIDE.md, then:

1. Update WEBHOOK_URL in Railway to your Railway domain
2. Update Stripe webhook endpoint to point to Railway
3. Make sure to add webhook events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `invoice.payment_failed`
   - `account.updated` (new - for Connect accounts)

---

## 💰 Revenue Tracking

### Platform Fee Structure

**One-Time Payments:**
```javascript
Platform Fee = Transaction Amount × 3%
Example: $9.99 × 3% = $0.30
```

**Subscriptions:**
```javascript
Monthly Platform Fee = Subscription Amount × 3%
Example: $4.99/month × 3% = $0.15/month
```

### Viewing Your Revenue

Use the `/platform-stats` command to see:
- Total connected servers
- Total payments processed
- Total platform revenue (all-time)
- Monthly recurring revenue (MRR)

**Example output:**
```
📊 Platform Statistics
🏢 Connected Servers: 25
💰 Total Payments Processed: 450
💵 Total Platform Revenue: $1,350.00
📈 Monthly Recurring Revenue: $225.00
```

---

## 🔧 Available Commands

### For Server Owners:

**`/setup-stripe`**
- Connects their Stripe account
- Admin-only command
- Returns onboarding link

**`/stripe-status`**
- Shows connection status
- Displays charges/payouts enabled status
- Shows platform fee (3%)

### For You (Platform Owner):

**`/platform-stats`**
- Shows all connected servers
- Total revenue across platform
- MRR calculations

---

## 📊 Database Structure

### Connected Accounts Table:
```json
{
  "guildId": "1430398723288203392",
  "stripeAccountId": "acct_...",
  "onboardingComplete": true,
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "createdAt": "2025-10-22...",
  "updatedAt": "2025-10-22..."
}
```

### Payments Table:
```json
{
  "userId": "482057590432464906",
  "guildId": "1430398723288203392",
  "tier": "basic",
  "paymentType": "onetime",
  "amount": 9.99,
  "platformFee": 0.30,
  "serverOwnerAmount": 9.69,
  "stripeAccountId": "acct_...",
  "status": "active"
}
```

---

## 🎓 How to Sell This Bot

### Pricing Models You Could Use:

**Option 1: Transaction Fee Only (Current)**
- Free to set up
- 3% per transaction
- Low barrier to entry

**Option 2: Monthly + Transaction Fee**
- $29/month + 2% per transaction
- Predictable revenue for you

**Option 3: Tiered Pricing**
- Free: Up to 50 transactions/month, 3% fee
- Pro: $49/month, unlimited, 2% fee
- Enterprise: Custom pricing, 1% fee

### Target Customers:

- Discord community owners with paid memberships
- Course creators selling access to Discord communities
- Gaming clans with premium tiers
- NFT project Discord servers
- Coaching/consulting Discord servers

---

## 🔐 Security & Compliance

### What You're Responsible For:

1. **Data Protection**
   - Backup `payments.json` regularly
   - Don't expose Stripe API keys
   - Keep webhook secrets secure

2. **Stripe Requirements**
   - Maintain Stripe Connect platform agreement
   - Monitor for fraudulent activity
   - Comply with Stripe's terms of service

3. **Server Owner Verification**
   - Stripe handles KYC/verification
   - You don't need to verify identities
   - Stripe manages payouts

### What Stripe Handles:

- Payment processing
- Fraud detection
- PCI compliance
- Server owner payouts
- Chargebacks

---

## 📈 Scaling Your Platform

### When You Have 10 Servers:

- 10 servers × $1,000/month average = $10,000/month processed
- Your 3% = $300/month revenue

### When You Have 100 Servers:

- 100 servers × $1,000/month average = $100,000/month processed
- Your 3% = $3,000/month revenue

### When You Have 1,000 Servers:

- 1,000 servers × $1,000/month average = $1,000,000/month processed
- Your 3% = $30,000/month revenue

---

## 🆘 Troubleshooting

### "This server has not completed Stripe setup yet"

**Cause:** Server owner hasn't run `/setup-stripe` or hasn't completed onboarding

**Solution:**
1. Run `/setup-stripe` as server admin
2. Complete Stripe onboarding process
3. Wait for Stripe to verify account
4. Run `/stripe-status` to check

### Platform fee not appearing in Stripe dashboard

**Cause:** Using test mode or fees haven't settled yet

**Solution:**
- In test mode, fees are simulated
- In live mode, fees appear in your Stripe balance within 24-48 hours
- Check: Stripe Dashboard → Connect → Transfers

### Server owner not receiving payouts

**Cause:** Haven't completed Stripe verification

**Solution:**
- Server owner must complete full Stripe onboarding
- Provide bank account information
- Verify identity with Stripe

---

## 🎉 You're Ready!

Your Discord payment bot is now a full SaaS platform! Here's what to do next:

1. **Test thoroughly** with ngrok and test mode
2. **Deploy to Railway** when ready
3. **Switch to Stripe live mode** using TEST_TO_LIVE_GUIDE.md
4. **Onboard your first server** using `/setup-stripe`
5. **Monitor revenue** with `/platform-stats`

**Questions or issues?** Check server logs for detailed error messages.

---

## 📞 Useful Links

- **Stripe Connect Dashboard:** https://dashboard.stripe.com/connect/accounts
- **Stripe Connect Docs:** https://stripe.com/docs/connect
- **Stripe Test Cards:** https://stripe.com/docs/testing
- **Your Payments Database:** `~/Documents/discord-payment-bot/payments.json`

Good luck building your SaaS platform! 🚀
