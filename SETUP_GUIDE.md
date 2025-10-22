# Discord Payment Bot - Complete Setup Guide

This guide will walk you through setting up your Discord payment bot from start to finish.

## Prerequisites

- Node.js installed on your computer (version 16 or higher)
- A Discord account with a server where you have Administrator permissions
- A Stripe account (free to create at https://stripe.com)
- A way to expose your webhook to the internet (we'll use ngrok for testing)

---

## Part 1: Discord Bot Setup

### Step 1: Create a Discord Application

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Give it a name (e.g., "Payment Bot")
4. Click "Create"

### Step 2: Create the Bot User

1. In your application, click "Bot" in the left sidebar
2. Click "Add Bot" and confirm
3. Under "Privileged Gateway Intents", enable:
   - SERVER MEMBERS INTENT
   - MESSAGE CONTENT INTENT
4. Click "Reset Token" and copy the token (you'll need this later)
   - **IMPORTANT:** Keep this token secret!

### Step 3: Invite Bot to Your Server

1. In your application, click "OAuth2" > "URL Generator" in the left sidebar
2. Select these scopes:
   - `bot`
3. Select these bot permissions:
   - Manage Roles
   - Send Messages
   - Read Messages/View Channels
4. Copy the generated URL at the bottom
5. Paste it in your browser and invite the bot to your server

### Step 4: Get Your Server ID

1. In Discord, go to User Settings > Advanced
2. Enable "Developer Mode"
3. Right-click your server name and click "Copy Server ID"
4. Save this for later

### Step 5: Create Roles in Your Discord Server

1. In Discord, go to Server Settings > Roles
2. Create three new roles (or however many tiers you want):
   - Basic Member
   - Premium Member
   - VIP Member
3. For each role, right-click and "Copy Role ID" (save these for later)
4. **IMPORTANT:** Drag the bot's role ABOVE these member roles in the role hierarchy
   - The bot can only assign roles that are below its own role

---

## Part 2: Stripe Setup

### Step 1: Create a Stripe Account

1. Go to https://stripe.com and sign up
2. Complete account verification
3. Switch to "Test Mode" (toggle in top right) for testing

### Step 2: Get Your API Keys

1. In Stripe Dashboard, go to Developers > API Keys
2. Copy your "Secret key" (starts with `sk_test_...`)
3. Save this for later

### Step 3: Create Products and Prices

For each membership tier, you'll create TWO prices (one-time and subscription):

#### Basic Tier:
1. Go to Products > Add Product
2. Name: "Basic Membership - One Time"
3. Price: $9.99, One-time
4. Click "Save product"
5. Copy the Price ID (starts with `price_...`)

6. Go back and create another product:
7. Name: "Basic Membership - Monthly"
8. Price: $4.99, Recurring monthly
9. Click "Save product"
10. Copy the Price ID

#### Repeat for Premium and VIP Tiers
- Premium: $29.99 one-time, $9.99/month
- VIP: $99.99 one-time, $19.99/month

### Step 4: Set Up Webhook

1. In Stripe Dashboard, go to Developers > Webhooks
2. Click "Add endpoint"
3. For now, use a placeholder URL: `https://example.com/webhook`
   - We'll update this once we get ngrok running
4. Select these events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_...`)

---

## Part 3: Configure the Bot

### Step 1: Create Environment File

1. Open the project folder: `/Users/jackson/Documents/discord-payment-bot`
2. Copy `.env.example` to `.env`
3. Open `.env` and fill in all the values:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_bot_token_from_step_2.4
DISCORD_CLIENT_ID=your_application_id_from_discord_developer_portal
GUILD_ID=your_server_id_from_step_4

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_from_part2_step2
STRIPE_WEBHOOK_SECRET=your_webhook_signing_secret_from_part2_step4

# Server Configuration
PORT=3000
WEBHOOK_URL=https://your-ngrok-url.com
```

### Step 2: Configure Role IDs and Price IDs

1. Open `config.js`
2. Replace each `REPLACE_WITH_ACTUAL_ROLE_ID` with the role IDs you copied earlier
3. Replace each `REPLACE_WITH_STRIPE_PRICE_ID` with the price IDs from Stripe

Example:
```javascript
basic: {
  name: 'Basic Member',
  roleId: '1234567890123456789', // Your actual role ID
  description: 'Access to basic channels and features',
  oneTime: {
    price: 9.99,
    stripePriceId: 'price_1ABC123...' // Your actual price ID
  },
  subscription: {
    monthlyPrice: 4.99,
    stripePriceId: 'price_1DEF456...' // Your actual price ID
  }
}
```

---

## Part 4: Expose Your Server to the Internet (for testing)

### Using ngrok (Recommended for Testing)

1. Download ngrok from https://ngrok.com/download
2. Sign up for a free account and get your auth token
3. Install ngrok following their instructions
4. Run this command in terminal:
   ```bash
   ngrok http 3000
   ```
5. Copy the HTTPS forwarding URL (e.g., `https://abc123.ngrok.io`)
6. Update your `.env` file:
   ```env
   WEBHOOK_URL=https://abc123.ngrok.io
   ```
7. Go back to Stripe Dashboard > Developers > Webhooks
8. Click on your webhook endpoint
9. Update the endpoint URL to: `https://abc123.ngrok.io/webhook`

**Note:** For production, you'll need a real domain and hosting (see Part 6)

---

## Part 5: Run the Bot

### Start the Bot

1. Open terminal
2. Navigate to the project:
   ```bash
   cd /Users/jackson/Documents/discord-payment-bot
   ```
3. Start the bot:
   ```bash
   npm start
   ```

You should see:
```
Discord Payment Bot is starting...
Make sure you have configured your .env file!
Bot is online as YourBotName#1234
Webhook server running on port 3000
```

---

## Part 6: Testing

### Test the Complete Flow

1. Create a test Discord account or use an alt account
2. Have that account join your Discord server
3. The bot should send a DM with role selection
4. Select a tier
5. Choose a payment option
6. Complete the payment using Stripe's test card:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
7. After payment, the role should be automatically assigned!

### Troubleshooting

If the role isn't assigned:
1. Check the bot's terminal for errors
2. Check that ngrok is still running
3. Verify the bot's role is ABOVE the member roles
4. Check Stripe Dashboard > Events to see if webhook was received
5. Make sure all IDs in `config.js` are correct

---

## Part 7: Production Deployment (When Ready)

For production use, you'll need:

1. **A hosting service** for your bot:
   - Heroku (easy, has free tier)
   - Railway (modern, simple)
   - DigitalOcean (more control)
   - AWS/Google Cloud (enterprise)

2. **A real domain** (optional but recommended):
   - Buy from Namecheap, GoDaddy, etc.
   - Or use the hosting service's provided domain

3. **Update Stripe webhook** to use your production URL

4. **Switch Stripe to Live Mode**:
   - In Stripe Dashboard, toggle from Test to Live mode
   - Update `.env` with live API keys
   - Recreate products with real prices
   - Update webhook endpoint

---

## Important Security Notes

- Never commit your `.env` file to Git (it's already in `.gitignore`)
- Never share your bot token or Stripe keys
- Keep your webhook secret secure
- For production, use environment variables on your hosting platform

---

## Commands to Remember

Start the bot:
```bash
npm start
```

Stop the bot:
```
Press Ctrl+C in the terminal
```

View logs:
```
They appear in the terminal where the bot is running
```

---

## Support

If you encounter issues:
1. Check the terminal for error messages
2. Verify all IDs and keys are correct
3. Make sure bot has proper permissions
4. Check Stripe events dashboard for webhook issues

---

## What Happens Behind the Scenes

1. User joins Discord server
2. Bot sends DM with role selection menu
3. User selects tier and payment type
4. Bot creates Stripe checkout session
5. User pays on Stripe
6. Stripe sends webhook to your server
7. Server verifies payment and assigns role
8. User gets confirmation DM

For subscriptions:
- If payment fails, user gets warning DM
- If subscription cancels, role is removed automatically
- Renewals are handled automatically

---

## File Structure

```
discord-payment-bot/
├── .env                  # Your secret configuration (DO NOT SHARE)
├── .env.example          # Template for .env
├── .gitignore           # Files to ignore in Git
├── package.json         # Node.js dependencies
├── config.js            # Role and pricing configuration
├── index.js             # Main entry point
├── bot.js               # Discord bot logic
├── server.js            # Webhook server
├── database.js          # Simple database for tracking payments
├── payments.json        # Database file (auto-created)
└── SETUP_GUIDE.md       # This file
```

Good luck with your Discord payment system!
