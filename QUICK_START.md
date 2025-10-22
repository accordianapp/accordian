# Quick Start Guide - Accordian Platform

Your Discord payment bot is now a full SaaS platform! You earn 3% on every transaction.

---

## ✅ What's Built

- ✅ Multi-tenant Stripe Connect integration
- ✅ Automatic 3% platform fee on all transactions
- ✅ Server owner onboarding via `/setup-stripe`
- ✅ Payment splitting (server owners get paid, you get 3%)
- ✅ Admin dashboard via `/platform-stats`
- ✅ Subscription support with recurring platform fees
- ✅ Webhook handlers for all payment events

---

## 🚀 Test It Now

### 1. Start ngrok:
```bash
cd ~/Documents/discord-payment-bot
./ngrok http 3000
```
Copy the ngrok URL (e.g., `https://abc123.ngrok-free.dev`)

### 2. Update .env:
```bash
WEBHOOK_URL=https://your-ngrok-url.ngrok-free.dev
```

### 3. Update Stripe webhook:
- Go to https://dashboard.stripe.com (Test mode)
- Developers → Webhooks → Your webhook
- Update URL to: `https://your-ngrok-url.ngrok-free.dev/webhook`
- Make sure these events are selected:
  - `checkout.session.completed`
  - `customer.subscription.deleted`
  - `customer.subscription.updated`
  - `invoice.payment_failed`
  - `account.updated` ← NEW!

### 4. Start the bot:
```bash
npm start
```

### 5. Test in Discord:

**As server admin:**
```
/setup-stripe
```
- Click the Stripe Connect onboarding link
- Complete the form (use test data)
- Stripe redirects you back when done

```
/stripe-status
```
- Verify your account is connected
- Check that charges are enabled

**As a regular user:**
- Join the server
- Bot sends welcome DM
- Select a membership tier
- Complete payment with test card: `4242 4242 4242 4242`
- Role assigned automatically!

**Check your platform revenue:**
```
/platform-stats
```
- See total connected servers
- See total revenue (your 3%)
- See monthly recurring revenue

---

## 💰 How You Make Money

**Every transaction:**
```
Customer pays: $9.99
Stripe fee: -$0.59 (2.9% + $0.30)
Your fee: -$0.30 (3%)
Server owner gets: $9.10
```

**You receive:**
- $0.30 per $9.99 one-time payment
- $0.15/month per $4.99/month subscription
- Automatically deposited to your Stripe account

---

## 📁 New Files Created

- `database.js` - Updated with connected accounts support
- `server.js` - Added Connect onboarding endpoints
- `bot.js` - Added slash command handlers
- `commands.js` - Slash command definitions
- `STRIPE_CONNECT_GUIDE.md` - Full platform documentation
- `QUICK_START.md` - This file

---

## 🎯 Next Steps

1. **Test thoroughly** - Make sure everything works
2. **Deploy to Railway** - Use DEPLOYMENT_GUIDE.md
3. **Go live** - Use TEST_TO_LIVE_GUIDE.md
4. **Find customers** - Market your bot to Discord server owners
5. **Scale** - More servers = more revenue!

---

## 💡 Pricing Ideas

When you sell this to server owners, you could charge:

**Option 1: Just the 3% fee**
- Free to set up
- 3% per transaction
- Easy to sell

**Option 2: Monthly + Lower Fee**
- $29/month + 2% per transaction
- Recurring revenue for you

**Option 3: One-time + Fee**
- $199 one-time setup + 3% ongoing
- Upfront cash + recurring

---

## 🆘 Common Issues

**"Server has not completed Stripe setup"**
→ Run `/setup-stripe` and complete onboarding

**Slash commands not showing**
→ Run `npm run register-commands`

**Platform fee not working**
→ Make sure `account.updated` webhook event is enabled

**Payment fails in test mode**
→ Use test card: `4242 4242 4242 4242`

---

## 📊 Revenue Projections

**10 servers × $1,000/mo processed:**
= $300/month for you

**100 servers × $1,000/mo processed:**
= $3,000/month for you

**1,000 servers × $1,000/mo processed:**
= $30,000/month for you

---

## ✨ You're All Set!

Your SaaS platform is ready to go. Start testing, then deploy and start finding customers!

**Read STRIPE_CONNECT_GUIDE.md for detailed documentation.**
