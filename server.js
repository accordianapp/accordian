require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { EmbedBuilder } = require('discord.js');
const config = require('./config');
const client = require('./bot');
const db = require('./database');
const { updateMemberDashboard } = require('./dashboard');

const app = express();

// Platform fee percentage (3%)
const PLATFORM_FEE_PERCENT = 3;

// ===== STRIPE CONNECT ONBOARDING ENDPOINTS =====

// JSON parsing for Connect endpoints
app.use('/connect', express.json());

// Start Connect onboarding
app.post('/connect/onboard', async (req, res) => {
  try {
    const { guildId, returnUrl } = req.body;

    if (!guildId) {
      return res.status(400).json({ error: 'guildId is required' });
    }

    // Check if account already exists
    let connectedAccount = await db.getConnectedAccountByGuildId(guildId);

    if (connectedAccount && connectedAccount.stripeAccountId) {
      // Account exists, create login link
      const loginLink = await stripe.accounts.createLoginLink(
        connectedAccount.stripeAccountId
      );
      return res.json({ url: loginLink.url });
    }

    // Create new connected account
    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
    });

    // Save to database
    await db.saveConnectedAccount({
      guildId: guildId,
      stripeAccountId: account.id,
      onboardingComplete: false,
      chargesEnabled: false
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.WEBHOOK_URL}/connect/onboard/refresh?guildId=${guildId}`,
      return_url: returnUrl || `${process.env.WEBHOOK_URL}/connect/onboard/complete?guildId=${guildId}`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    console.error('Error creating Connect account:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle onboarding refresh (if user navigates away)
app.get('/connect/onboard/refresh', async (req, res) => {
  try {
    const { guildId } = req.query;
    const connectedAccount = await db.getConnectedAccountByGuildId(guildId);

    if (!connectedAccount) {
      return res.status(400).send('Account not found');
    }

    const accountLink = await stripe.accountLinks.create({
      account: connectedAccount.stripeAccountId,
      refresh_url: `${process.env.WEBHOOK_URL}/connect/onboard/refresh?guildId=${guildId}`,
      return_url: `${process.env.WEBHOOK_URL}/connect/onboard/complete?guildId=${guildId}`,
      type: 'account_onboarding',
    });

    res.redirect(accountLink.url);
  } catch (error) {
    console.error('Error refreshing Connect onboarding:', error);
    res.status(500).send('Error refreshing onboarding');
  }
});

// Handle onboarding completion
app.get('/connect/onboard/complete', async (req, res) => {
  try {
    const { guildId } = req.query;
    const connectedAccount = await db.getConnectedAccountByGuildId(guildId);

    if (!connectedAccount) {
      return res.status(400).send('Account not found');
    }

    // Fetch account details from Stripe
    const account = await stripe.accounts.retrieve(connectedAccount.stripeAccountId);

    // Update database with onboarding status
    await db.saveConnectedAccount({
      ...connectedAccount,
      onboardingComplete: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Setup Complete</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            backdrop-filter: blur(10px);
          }
          h1 { font-size: 48px; margin: 0 0 20px 0; }
          p { font-size: 20px; margin: 10px 0; }
          .status { font-size: 16px; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Setup Complete!</h1>
          <p>Your Stripe account has been connected.</p>
          <p class="status">Charges Enabled: ${account.charges_enabled ? '✓' : '✗'}</p>
          <p class="status">Payouts Enabled: ${account.payouts_enabled ? '✓' : '✗'}</p>
          <p>You can close this page and return to Discord.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error completing Connect onboarding:', error);
    res.status(500).send('Error completing onboarding');
  }
});

// Get account status
app.get('/connect/status/:guildId', async (req, res) => {
  try {
    const { guildId } = req.params;
    const connectedAccount = await db.getConnectedAccountByGuildId(guildId);

    if (!connectedAccount) {
      return res.json({ connected: false });
    }

    // Fetch latest status from Stripe
    const account = await stripe.accounts.retrieve(connectedAccount.stripeAccountId);

    res.json({
      connected: true,
      onboardingComplete: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });
  } catch (error) {
    console.error('Error fetching Connect status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Post payment receipt to log channel
async function postPaymentReceipt(guild, member, tier, paymentType, amount) {
  try {
    const channelId = config.serverSettings.paymentLogChannelId;
    if (!channelId || channelId === 'REPLACE_WITH_CHANNEL_ID') {
      console.log('Payment log channel not configured, skipping receipt post');
      return;
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      console.error(`Payment log channel ${channelId} not found`);
      return;
    }

    const receiptEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('💰 New Payment Received')
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: '👤 Member', value: `${member.user.tag}\n<@${member.user.id}>`, inline: true },
        { name: '🎫 Tier', value: config.roles[tier].name, inline: true },
        { name: '💵 Amount', value: `$${amount.toFixed(2)}`, inline: true },
        { name: '📋 Type', value: paymentType === 'onetime' ? 'One-time Payment' : 'Monthly Subscription', inline: true },
        { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        { name: '✅ Status', value: 'Completed', inline: true }
      )
      .setFooter({ text: `User ID: ${member.user.id}` })
      .setTimestamp();

    await channel.send({ embeds: [receiptEmbed] });
    console.log(`Posted payment receipt to channel ${channelId}`);
  } catch (error) {
    console.error('Error posting payment receipt:', error);
  }
}

// Stripe webhook - needs raw body
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleSuccessfulPayment(session);
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await handleSubscriptionCancelled(subscription);
      break;

    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object;
      if (updatedSubscription.status === 'active') {
        await handleSubscriptionRenewed(updatedSubscription);
      }
      break;

    case 'invoice.payment_failed':
      const invoice = event.data.object;
      await handlePaymentFailed(invoice);
      break;

    // Stripe Connect events
    case 'account.updated':
      const account = event.data.object;
      await handleAccountUpdated(account);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Handle successful payment
async function handleSuccessfulPayment(session) {
  try {
    const discordUserId = session.metadata.discordUserId;
    const tier = session.metadata.tier;
    const paymentType = session.metadata.paymentType;
    const guildId = session.metadata.guildId;

    // Get connected account for this guild
    const connectedAccount = await db.getConnectedAccountByGuildId(guildId);

    if (!connectedAccount) {
      console.error(`No connected account found for guild ${guildId}`);
      return;
    }

    const roleId = config.roles[tier].roleId;

    console.log(`Processing payment for user ${discordUserId}, tier: ${tier}, type: ${paymentType}, guild: ${guildId}`);

    // Get the guild and member
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(discordUserId);

    // Assign the role
    const role = guild.roles.cache.get(roleId);
    if (role) {
      await member.roles.add(role);
      console.log(`Assigned role ${role.name} to ${member.user.tag}`);

      // Calculate platform fee
      const totalAmount = session.amount_total / 100;
      const platformFee = totalAmount * (PLATFORM_FEE_PERCENT / 100);
      const serverOwnerReceives = totalAmount - platformFee;

      // Save to database
      await db.savePayment({
        userId: discordUserId,
        guildId: guildId,
        tier: tier,
        paymentType: paymentType,
        stripeCustomerId: session.customer,
        stripeSessionId: session.id,
        subscriptionId: session.subscription || null,
        amount: totalAmount,
        platformFee: platformFee,
        serverOwnerAmount: serverOwnerReceives,
        stripeAccountId: connectedAccount.stripeAccountId,
        status: 'active',
        createdAt: new Date()
      });

      // Send confirmation DM
      const successMessage = config.serverSettings.paymentSuccessMessage
        .replace('{tier}', config.roles[tier].name);
      await member.send({ content: successMessage });

      // Post receipt to payment log channel
      await postPaymentReceipt(guild, member, tier, paymentType, totalAmount);

      // Update member dashboard
      await updateMemberDashboard(guild);
    } else {
      console.error(`Role ${roleId} not found in guild`);
    }
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(subscription) {
  try {
    const payment = await db.getPaymentBySubscriptionId(subscription.id);

    if (!payment) {
      console.log('Payment not found for subscription:', subscription.id);
      return;
    }

    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const member = await guild.members.fetch(payment.userId);
    const roleId = config.roles[payment.tier].roleId;

    // Remove the role
    const role = guild.roles.cache.get(roleId);
    if (role) {
      await member.roles.remove(role);
      console.log(`Removed role ${role.name} from ${member.user.tag}`);

      // Update database
      await db.updatePaymentStatus(payment.userId, 'cancelled');

      // Send notification DM
      await member.send({
        content: `ℹ️ Your subscription has been cancelled and your **${config.roles[payment.tier].name}** role has been removed.\n\nWe hope to see you again!`
      });

      // Update member dashboard
      await updateMemberDashboard(guild);
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

// Handle subscription renewal
async function handleSubscriptionRenewed(subscription) {
  try {
    const payment = await db.getPaymentBySubscriptionId(subscription.id);

    if (!payment) {
      console.log('Payment not found for subscription:', subscription.id);
      return;
    }

    // Update database
    await db.updatePaymentStatus(payment.userId, 'active');

    console.log(`Subscription renewed for user ${payment.userId}`);
  } catch (error) {
    console.error('Error handling subscription renewal:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice) {
  try {
    const subscriptionId = invoice.subscription;
    const payment = await db.getPaymentBySubscriptionId(subscriptionId);

    if (!payment) {
      console.log('Payment not found for subscription:', subscriptionId);
      return;
    }

    const guild = await client.guilds.fetch(payment.guildId || process.env.GUILD_ID);
    const member = await guild.members.fetch(payment.userId);

    // Send warning DM
    await member.send({
      content: `⚠️ Your subscription payment failed.\n\nPlease update your payment method to avoid losing access to your **${config.roles[payment.tier].name}** role.`
    });
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Handle Connect account updates
async function handleAccountUpdated(account) {
  try {
    const connectedAccount = await db.getConnectedAccountByStripeId(account.id);

    if (!connectedAccount) {
      console.log('Connected account not found:', account.id);
      return;
    }

    // Update account status in database
    await db.saveConnectedAccount({
      ...connectedAccount,
      onboardingComplete: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });

    console.log(`Updated account status for ${account.id}:`, {
      charges: account.charges_enabled,
      payouts: account.payouts_enabled
    });
  } catch (error) {
    console.error('Error handling account update:', error);
  }
}

// Success page
app.get('/success', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Successful</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          backdrop-filter: blur(10px);
        }
        h1 { font-size: 48px; margin: 0 0 20px 0; }
        p { font-size: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>✅ Payment Successful!</h1>
        <p>Your role has been assigned in Discord.</p>
        <p>You can close this page and return to Discord.</p>
      </div>
    </body>
    </html>
  `);
});

// Cancel page
app.get('/cancel', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Cancelled</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          backdrop-filter: blur(10px);
        }
        h1 { font-size: 48px; margin: 0 0 20px 0; }
        p { font-size: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>❌ Payment Cancelled</h1>
        <p>You can try again anytime in Discord.</p>
        <p>You can close this page and return to Discord.</p>
      </div>
    </body>
    </html>
  `);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
