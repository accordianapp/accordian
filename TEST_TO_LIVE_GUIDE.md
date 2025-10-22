# Switching from Test Mode to Live Mode

This guide covers everything you need to do to switch your bot from Stripe test mode to live production mode.

---

## ⚠️ Important Notice

**DO NOT** switch to live mode until:
- ✅ You have thoroughly tested the bot with Stripe test cards
- ✅ All features are working correctly (payments, roles, dashboard, receipts)
- ✅ You have verified webhook delivery is working
- ✅ You are ready to accept real payments from real customers

---

## 📋 Step-by-Step Migration Process

### Step 1: Switch Stripe to Live Mode

1. **Go to Stripe Dashboard**
   - Navigate to https://dashboard.stripe.com

2. **Toggle to Live Mode**
   - In the top right corner, you'll see a toggle switch that says "Test mode"
   - Click it to switch to "Live mode"
   - You'll see the interface change (usually different color scheme)

---

### Step 2: Get Live API Keys

1. **Navigate to API Keys**
   - In Stripe Dashboard (Live mode), go to: **Developers → API Keys**

2. **Copy Your Live Secret Key**
   - Find "Secret key" (starts with `sk_live_...`)
   - Click "Reveal live key token"
   - Click the copy button
   - **IMPORTANT:** Save this somewhere secure temporarily (you'll need it in Step 5)

3. **Keep This Safe**
   - Never share this key
   - Never commit it to GitHub
   - Never send it in Discord or email

---

### Step 3: Recreate Products in Live Mode

You need to recreate all your products and prices in live mode (Stripe doesn't automatically copy from test mode).

**For Each Membership Tier:**

1. **Create Product**
   - Go to **Products** in Stripe Dashboard (Live mode)
   - Click **"+ Add product"**
   - Name: "Basic Membership" (or your tier name)
   - Description: (optional)
   - Click **"Save product"**

2. **Add One-Time Payment Price**
   - Click **"Add another price"**
   - Price: $9.99 (your actual price)
   - Billing period: **One time**
   - Click **"Add price"**
   - **Copy the Price ID** (starts with `price_...`)
   - Save this as: `Basic - One-time Price ID`

3. **Add Subscription Price**
   - Click **"Add another price"** again
   - Price: $4.99/month (your actual price)
   - Billing period: **Recurring**
   - Billing frequency: **Monthly**
   - Click **"Add price"**
   - **Copy the Price ID** (starts with `price_...`)
   - Save this as: `Basic - Subscription Price ID`

4. **Repeat for All Tiers**
   - Create products for Premium, VIP, etc.
   - Create both one-time and subscription prices for each
   - Keep track of all the Price IDs

**Your Price ID List Should Look Like:**
```
Basic Member:
- One-time: price_1ABC123...
- Subscription: price_1DEF456...

Premium Member:
- One-time: price_1GHI789...
- Subscription: price_1JKL012...

VIP Member:
- One-time: price_1MNO345...
- Subscription: price_1PQR678...
```

---

### Step 4: Create Live Webhook Endpoint

1. **Go to Webhooks**
   - In Stripe Dashboard (Live mode): **Developers → Webhooks**

2. **Add Endpoint**
   - Click **"Add endpoint"**
   - Endpoint URL: (Use your production URL)
     - Railway: `https://your-app.up.railway.app/webhook`
     - Heroku: `https://your-app.herokuapp.com/webhook`
     - DigitalOcean: `https://yourdomain.com/webhook`
   - **IMPORTANT:** Include `/webhook` at the end!

3. **Select Events to Listen For**
   Click **"Select events"** and choose:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `invoice.payment_failed`

4. **Add Endpoint**
   - Click **"Add endpoint"**

5. **Copy Webhook Signing Secret**
   - Click on your newly created webhook
   - Under "Signing secret", click **"Reveal"**
   - Copy the secret (starts with `whsec_...`)
   - Save this as: `Live Webhook Secret`

---

### Step 5: Update config.js with Live Price IDs

Edit your `config.js` file and replace all test Price IDs with live Price IDs:

**Before (Test Mode):**
```javascript
basic: {
  name: 'Basic Member',
  roleId: '1430401898682515456',
  description: 'Access to basic channels and features',
  oneTime: {
    price: 9.99,
    stripePriceId: 'price_1SKt4GChgZ0yaO7UoSnxlGcj'  // TEST
  },
  subscription: {
    monthlyPrice: 4.99,
    stripePriceId: 'price_1SKt74ChgZ0yaO7U8CJFgdfg'  // TEST
  }
}
```

**After (Live Mode):**
```javascript
basic: {
  name: 'Basic Member',
  roleId: '1430401898682515456',
  description: 'Access to basic channels and features',
  oneTime: {
    price: 9.99,
    stripePriceId: 'price_1ABC123...'  // LIVE - from Step 3
  },
  subscription: {
    monthlyPrice: 4.99,
    stripePriceId: 'price_1DEF456...'  // LIVE - from Step 3
  }
}
```

**Repeat for all tiers!**

---

### Step 6: Update Environment Variables

Update your `.env` file (local) or deployment platform environment variables:

**Variables to Change:**

1. **STRIPE_SECRET_KEY**
   - Old: `sk_test_...`
   - New: `sk_live_...` (from Step 2)

2. **STRIPE_WEBHOOK_SECRET**
   - Old: `whsec_...` (test)
   - New: `whsec_...` (live - from Step 4)

**Variables to Keep the Same:**
- `DISCORD_TOKEN` - Same for test and live
- `DISCORD_CLIENT_ID` - Same
- `GUILD_ID` - Same
- `PORT` - Same
- `WEBHOOK_URL` - Should be your production URL

**Example .env File (LIVE MODE):**
```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
GUILD_ID=your_guild_id_here

# Stripe Configuration - LIVE MODE
STRIPE_SECRET_KEY=sk_live_51ABC123...  # ← CHANGED TO LIVE KEY
STRIPE_WEBHOOK_SECRET=whsec_ABC123...  # ← CHANGED TO LIVE SECRET

# Server Configuration
PORT=3000
WEBHOOK_URL=https://your-production-url.com
```

---

### Step 7: Deploy Changes

**If Using Railway/Heroku (GitHub):**

1. Commit your changes:
   ```bash
   git add config.js
   git commit -m "Switch to live Stripe mode"
   git push origin main
   ```

2. Update environment variables in platform dashboard:
   - Railway: Variables tab
   - Heroku: Settings → Config Vars

3. Platform will auto-deploy

**If Using DigitalOcean:**

1. Upload updated `config.js`:
   ```bash
   scp ~/Documents/discord-payment-bot/config.js root@your_ip:/root/discord-payment-bot/
   ```

2. SSH into server and update `.env`:
   ```bash
   ssh root@your_ip
   cd /root/discord-payment-bot
   nano .env
   # Update STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
   ```

3. Restart the bot:
   ```bash
   pm2 restart discord-payment-bot
   ```

---

### Step 8: Verify Webhook Connection

1. **Go to Stripe Dashboard**
   - Developers → Webhooks
   - Click on your webhook endpoint

2. **Send Test Event**
   - Click "Send test webhook"
   - Select `checkout.session.completed`
   - Click "Send test webhook"

3. **Check Response**
   - Should show "200 OK" response
   - If error, check your server logs and webhook URL

---

### Step 9: Test with Real Payment (Small Amount)

**IMPORTANT:** This will charge your real card!

1. **Create a Test Order**
   - Use a real Discord account (or alt account)
   - Have them join your server
   - Go through the payment flow

2. **Use Real Payment Method**
   - Enter real card details
   - Use a small amount to test (e.g., if Basic tier is $9.99, this is the minimum)

3. **Verify Everything Works**
   - ✅ Payment processes successfully
   - ✅ Money appears in Stripe dashboard
   - ✅ Role is assigned in Discord
   - ✅ Receipt appears in payment log channel
   - ✅ Member appears on dashboard

4. **Refund Test Payment (Optional)**
   - In Stripe Dashboard → Payments
   - Find your test payment
   - Click "Refund"
   - Refund the full amount

---

### Step 10: Enable Customer Portal (For Subscription Management)

Allow customers to manage their own subscriptions:

1. **Go to Stripe Dashboard**
   - Settings → Billing → Customer portal

2. **Configure Portal**
   - Enable: "Cancel subscriptions"
   - Enable: "Update payment methods"
   - Set cancellation behavior: "Cancel immediately" or "At period end"

3. **Save Settings**

4. **Share Portal Link**
   - Customers can access it at: https://billing.stripe.com/p/login/test_...
   - You can also add this to your bot's success messages or create a command

---

## 🔍 Verification Checklist

After switching to live mode, verify:

- [ ] Stripe is in Live mode (not Test mode)
- [ ] Live API keys are in environment variables
- [ ] All products recreated in Live mode
- [ ] All Price IDs updated in `config.js`
- [ ] Live webhook endpoint created
- [ ] Webhook secret updated in environment variables
- [ ] Webhook URL includes `/webhook` path
- [ ] Test payment processed successfully
- [ ] Role assigned automatically
- [ ] Receipt posted to log channel
- [ ] Dashboard updated with new member
- [ ] Real money received in Stripe
- [ ] Customer portal enabled

---

## ⚠️ Common Mistakes to Avoid

### ❌ Using Test Price IDs in Live Mode
**Problem:** Bot tries to create checkout with test prices in live mode
**Fix:** Update all Price IDs in `config.js` with live versions

### ❌ Forgetting to Update Webhook Secret
**Problem:** Webhooks fail, roles aren't assigned
**Fix:** Copy live webhook secret from Stripe and update environment variables

### ❌ Missing `/webhook` in Webhook URL
**Problem:** Webhooks return 404
**Fix:** Ensure URL ends with `/webhook`: `https://your-domain.com/webhook`

### ❌ Not Restarting Bot After Changes
**Problem:** Bot still uses old test keys
**Fix:** Restart bot/redeploy after updating environment variables

### ❌ Bot Role Below Member Roles
**Problem:** Bot can't assign roles even with live payments
**Fix:** In Discord Server Settings → Roles, drag bot role ABOVE member roles

---

## 🔄 Rolling Back to Test Mode

If you need to go back to test mode:

1. Toggle Stripe back to Test mode
2. Revert `config.js` to test Price IDs
3. Update `STRIPE_SECRET_KEY` back to `sk_test_...`
4. Update `STRIPE_WEBHOOK_SECRET` back to test webhook secret
5. Redeploy/restart bot

---

## 💰 Understanding Stripe Fees (Live Mode)

Stripe charges fees on live transactions:

**Standard Pricing:**
- 2.9% + $0.30 per successful transaction
- Example: $9.99 payment = $0.59 fee, you receive $9.40

**Subscriptions:**
- Same 2.9% + $0.30 per charge
- Charged monthly when subscription renews

**Plan accordingly** when setting your prices!

---

## 📊 Monitoring Live Payments

**Stripe Dashboard:**
- Payments → View all transactions
- Customers → View all customers
- Subscriptions → Manage active subscriptions
- Developers → Webhooks → View webhook logs

**Discord:**
- Payment receipts in your log channel
- Live dashboard showing active members

**Database:**
- `payments.json` file contains all transaction records
- Backup regularly!

---

## 🆘 Troubleshooting Live Mode

### Payments Failing
1. Check Stripe dashboard for error messages
2. Verify Price IDs are correct live versions
3. Check webhook logs in Stripe

### Webhooks Not Delivering
1. Verify webhook URL is correct
2. Check server is running and accessible
3. Review webhook signing secret
4. Check server logs for errors

### Roles Not Assigning
1. Verify webhook is delivering successfully
2. Check bot has Manage Roles permission
3. Verify bot role is above member roles
4. Check server logs

---

## ✅ You're Live!

Once everything is verified and working:

1. **Monitor for the first 24 hours** - Watch for any issues
2. **Check Stripe webhook logs daily** - Ensure all events processing
3. **Backup your database** - Schedule regular backups of `payments.json`
4. **Announce to your community** - Let members know paid memberships are live!

**Congratulations! Your Discord Payment Bot is now in production!** 🎉

---

## 📞 Need Help?

- **Stripe Support:** https://support.stripe.com
- **Discord Developer Support:** https://discord.com/developers/docs
- **Check your server logs** for specific error messages
