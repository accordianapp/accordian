# Discord Payment Bot - Automated Membership System

A fully automated Discord bot that handles paid memberships with Stripe integration. Perfect for server owners who want to monetize their Discord community with different membership tiers.

## ✨ Features

- **Automatic Role Assignment** - Members get roles immediately after payment
- **Multiple Payment Options** - Support for both one-time payments and monthly subscriptions
- **Payment Receipts** - Beautiful embeds posted to your designated channel
- **Subscription Management** - Automatic role removal when subscriptions cancel
- **Payment Failure Alerts** - DM warnings when subscription payments fail
- **Customizable Tiers** - Create unlimited membership levels with custom pricing
- **Fully Automated** - No manual intervention needed after setup

## 💰 What This Bot Does

1. **New Member Joins** → Bot sends them a DM with membership options
2. **Member Selects Tier** → Shows pricing for one-time or subscription
3. **Member Pays via Stripe** → Secure payment processing
4. **Role Automatically Assigned** → Instant access to member areas
5. **Receipt Posted** → Payment logged in your admin channel
6. **Subscription Management** → Auto-renewal or cancellation handling

## 📊 Payment Receipt Example

When a payment is received, the bot posts a professional embed to your payment log channel showing:
- Member name and avatar
- Membership tier purchased
- Amount paid
- Payment type (one-time or subscription)
- Timestamp
- User ID for reference

## 🚀 Setup Guide for Server Owners

### Prerequisites

- A Discord server where you have Administrator permissions
- A Stripe account (free at stripe.com)
- A server or hosting service to run the bot (DigitalOcean, Railway, Heroku, etc.)

### Step 1: Discord Bot Setup

1. Create a bot at https://discord.com/developers/applications
2. Enable these Privileged Gateway Intents:
   - SERVER MEMBERS INTENT
   - MESSAGE CONTENT INTENT
3. Invite bot to your server with these permissions:
   - Manage Roles
   - Send Messages
   - Read Messages/View Channels

### Step 2: Create Your Roles

1. In Discord Server Settings > Roles, create your membership tiers:
   - Basic Member
   - Premium Member
   - VIP Member (or whatever you want)
2. **IMPORTANT:** Position the bot's role ABOVE your membership roles
3. Copy each Role ID (right-click > Copy Role ID with Developer Mode enabled)

### Step 3: Create Payment Log Channel

1. Create a private channel (e.g., #payment-logs)
2. Only admins should see this channel
3. Copy the Channel ID (right-click > Copy Channel ID)

### Step 4: Configure Stripe

1. Go to https://stripe.com and create products for each tier:
   - Create ONE product per tier (e.g., "Basic Membership")
   - Add TWO prices to each product:
     - One-time payment price
     - Monthly subscription price
2. Copy all the Price IDs (they start with `price_...`)
3. Set up a webhook endpoint pointing to your bot's URL + `/webhook`
4. Copy your Stripe Secret Key and Webhook Secret

### Step 5: Configure the Bot

Edit `config.js`:

```javascript
module.exports = {
  serverSettings: {
    paymentLogChannelId: 'YOUR_CHANNEL_ID_HERE',
    welcomeMessage: 'Customize your welcome message here! Use {username} as placeholder.',
    paymentSuccessMessage: 'Customize success message! Use {tier} as placeholder.',
  },

  roles: {
    basic: {
      name: 'Basic Member',
      roleId: 'YOUR_ROLE_ID',
      description: 'What members get with this tier',
      oneTime: {
        price: 9.99,
        stripePriceId: 'price_xxxxx'
      },
      subscription: {
        monthlyPrice: 4.99,
        stripePriceId: 'price_yyyyy'
      }
    },
    // Add more tiers as needed
  }
};
```

Edit `.env`:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_id
GUILD_ID=your_server_id

STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

PORT=3000
WEBHOOK_URL=https://yourdomain.com
```

### Step 6: Deploy

#### Option A: Railway (Recommended - Easy)

1. Push code to GitHub
2. Connect Railway to your GitHub repo
3. Railway auto-deploys
4. Add environment variables in Railway dashboard
5. Get your public URL from Railway

#### Option B: DigitalOcean

1. Create a droplet
2. Install Node.js
3. Clone your repo
4. Run `npm install`
5. Use PM2 to keep bot running: `pm2 start index.js --name payment-bot`

#### Option C: Heroku

1. Create a new Heroku app
2. Connect to GitHub or use Heroku CLI
3. Add environment variables in Settings
4. Deploy

### Step 7: Update Stripe Webhook

1. In Stripe Dashboard, update your webhook URL to your deployed bot URL + `/webhook`
2. Example: `https://your-bot-domain.com/webhook`

## 🎮 Usage for Your Members

Members simply:
1. Join your Discord server
2. Receive an automated DM from the bot
3. Select their desired membership tier
4. Choose one-time or subscription payment
5. Complete payment via Stripe
6. Instantly get their role and access!

## 📋 Managing Subscriptions

### For Members
- Members can cancel subscriptions in their Stripe customer portal
- Role is automatically removed upon cancellation
- Payment failures trigger a DM to update payment method

### For You (Server Owner)
- All payments logged in your payment log channel
- View all transactions in Stripe Dashboard
- Full control over pricing and tiers
- Can manually assign/remove roles if needed

## 🔧 Customization Options

### Add More Tiers

Just copy the tier structure in `config.js`:

```javascript
premium: {
  name: 'Premium Member',
  roleId: 'ROLE_ID',
  description: 'Premium features',
  oneTime: { price: 29.99, stripePriceId: 'price_xxx' },
  subscription: { monthlyPrice: 9.99, stripePriceId: 'price_yyy' }
}
```

Then add the option in `bot.js` in the select menu options array.

### Change Welcome Messages

Edit the messages in `config.js` under `serverSettings`.

### Change Receipt Format

Edit the `postPaymentReceipt()` function in `server.js`.

## 💡 Tips for Success

1. **Price Testing** - Start with Stripe test mode before going live
2. **Clear Descriptions** - Make tier benefits obvious to members
3. **Monitor Receipts** - Check your payment log channel regularly
4. **Communication** - Have a support channel for payment questions
5. **Stripe Portal** - Enable customer portal so members can manage subscriptions

## 📞 Support

For issues or questions:
- Check the SETUP_GUIDE.md for detailed setup instructions
- Verify all Role IDs and Price IDs are correct
- Ensure bot role is above member roles
- Check Stripe webhook logs for errors

## 🛡️ Security Notes

- Never share your `.env` file or bot token
- Keep your Stripe secret keys secure
- Only give bot minimum required permissions
- Regularly review payment logs for suspicious activity

## 📈 Revenue Tracking

Monitor your revenue through:
- Stripe Dashboard (detailed analytics)
- Payment receipts channel (real-time notifications)
- `payments.json` database file (local records)

---

**Ready to monetize your Discord community? Get started today!**
