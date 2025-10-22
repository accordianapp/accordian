require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config');
const db = require('./database');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

// When bot is ready
client.once('ready', () => {
  console.log(`Bot is online as ${client.user.tag}`);
});

// ===== SLASH COMMAND HANDLERS =====

// Handle /setup-stripe command
async function handleSetupStripe(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guild.id;

    // Check if already connected
    const existingAccount = await db.getConnectedAccountByGuildId(guildId);

    if (existingAccount && existingAccount.chargesEnabled) {
      return await interaction.editReply({
        content: '✅ Your Stripe account is already connected and active!\n\nUse `/stripe-status` to view details.',
        ephemeral: true
      });
    }

    // Make API call to start onboarding
    const response = await fetch(`${process.env.WEBHOOK_URL}/connect/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guildId: guildId })
    });

    const data = await response.json();

    if (data.url) {
      await interaction.editReply({
        content: `🔗 **Connect Your Stripe Account**\n\nClick the link below to connect your Stripe account and start accepting payments:\n\n${data.url}\n\n*This link will guide you through Stripe's secure onboarding process.*`,
        ephemeral: true
      });
    } else {
      await interaction.editReply({
        content: '❌ Error creating onboarding link. Please try again.',
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error in handleSetupStripe:', error);
    await interaction.editReply({
      content: '❌ An error occurred. Please try again later.',
      ephemeral: true
    });
  }
}

// Handle /stripe-status command
async function handleStripeStatus(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guild.id;
    const connectedAccount = await db.getConnectedAccountByGuildId(guildId);

    if (!connectedAccount) {
      return await interaction.editReply({
        content: '❌ No Stripe account connected.\n\nUse `/setup-stripe` to get started.',
        ephemeral: true
      });
    }

    const statusEmbed = new EmbedBuilder()
      .setColor(connectedAccount.chargesEnabled ? '#00ff00' : '#ffaa00')
      .setTitle('Stripe Account Status')
      .addFields(
        { name: 'Account ID', value: connectedAccount.stripeAccountId, inline: false },
        { name: 'Onboarding Complete', value: connectedAccount.onboardingComplete ? '✅ Yes' : '❌ No', inline: true },
        { name: 'Charges Enabled', value: connectedAccount.chargesEnabled ? '✅ Yes' : '❌ No', inline: true },
        { name: 'Payouts Enabled', value: connectedAccount.payoutsEnabled ? '✅ Yes' : '❌ No', inline: true }
      )
      .setFooter({ text: 'Platform Fee: 3% per transaction' })
      .setTimestamp();

    await interaction.editReply({
      embeds: [statusEmbed],
      ephemeral: true
    });
  } catch (error) {
    console.error('Error in handleStripeStatus:', error);
    await interaction.editReply({
      content: '❌ An error occurred fetching status.',
      ephemeral: true
    });
  }
}

// Handle /platform-stats command (for you, the platform owner)
async function handlePlatformStats(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const allAccounts = await db.getAllConnectedAccounts();
    const allPayments = await db.getAllPayments();

    // Calculate total platform revenue
    const totalPlatformFees = allPayments.reduce((sum, payment) => {
      return sum + (payment.platformFee || 0);
    }, 0);

    // Calculate MRR from subscriptions
    const subscriptionPayments = allPayments.filter(p => p.paymentType === 'subscription' && p.status === 'active');
    const monthlyPlatformRevenue = subscriptionPayments.reduce((sum, payment) => {
      return sum + (payment.platformFee || 0);
    }, 0);

    const statsEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📊 Platform Statistics')
      .addFields(
        { name: '🏢 Connected Servers', value: allAccounts.length.toString(), inline: true },
        { name: '💰 Total Payments Processed', value: allPayments.length.toString(), inline: true },
        { name: '💵 Total Platform Revenue', value: `$${totalPlatformFees.toFixed(2)}`, inline: true },
        { name: '📈 Monthly Recurring Revenue', value: `$${monthlyPlatformRevenue.toFixed(2)}`, inline: true }
      )
      .setFooter({ text: 'Accordian Platform' })
      .setTimestamp();

    await interaction.editReply({
      embeds: [statsEmbed],
      ephemeral: true
    });
  } catch (error) {
    console.error('Error in handlePlatformStats:', error);
    await interaction.editReply({
      content: '❌ An error occurred fetching statistics.',
      ephemeral: true
    });
  }
}

// When a new member joins the server
client.on('guildMemberAdd', async (member) => {
  try {
    // Create welcome embed
    const welcomeMessage = config.serverSettings.welcomeMessage.replace('{username}', member.user.username);
    const welcomeEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Welcome to the Server!')
      .setDescription(welcomeMessage)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    // Create role selection menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('role_select')
      .setPlaceholder('Choose your membership tier')
      .addOptions([
        {
          label: config.roles.basic.name,
          description: config.roles.basic.description,
          value: 'basic',
          emoji: '🥉'
        }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Send DM to the new member
    await member.send({
      embeds: [welcomeEmbed],
      components: [row]
    });

    console.log(`Sent welcome message to ${member.user.tag}`);
  } catch (error) {
    console.error(`Could not send DM to ${member.user.tag}:`, error);
  }
});

// Handle interactions (slash commands, menus, buttons)
client.on('interactionCreate', async (interaction) => {
  try {
    console.log(`Received interaction: ${interaction.isCommand() ? interaction.commandName : interaction.customId}`);

    // Handle slash commands
    if (interaction.isCommand()) {
      if (interaction.commandName === 'setup-stripe') {
        await handleSetupStripe(interaction);
        return;
      }

      if (interaction.commandName === 'stripe-status') {
        await handleStripeStatus(interaction);
        return;
      }

      if (interaction.commandName === 'platform-stats') {
        await handlePlatformStats(interaction);
        return;
      }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'role_select') {
    const selectedTier = interaction.values[0];
    const tierConfig = config.roles[selectedTier];

    // Create pricing embed
    const pricingEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle(`${tierConfig.name} - Pricing Options`)
      .setDescription(tierConfig.description)
      .addFields(
        {
          name: '💳 One-Time Payment',
          value: `$${tierConfig.oneTime.price} - Lifetime access`,
          inline: true
        },
        {
          name: '📅 Monthly Subscription',
          value: `$${tierConfig.subscription.monthlyPrice}/month - Cancel anytime`,
          inline: true
        }
      )
      .setFooter({ text: 'Choose your preferred payment option below' });

    // Create payment option buttons
    const buttonRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`payment_onetime_${selectedTier}`)
          .setLabel(`Pay $${tierConfig.oneTime.price} Once`)
          .setStyle(ButtonStyle.Success)
          .setEmoji('💳'),
        new ButtonBuilder()
          .setCustomId(`payment_subscription_${selectedTier}`)
          .setLabel(`Subscribe $${tierConfig.subscription.monthlyPrice}/mo`)
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📅')
      );

    await interaction.update({
      embeds: [pricingEmbed],
      components: [buttonRow]
    });
  }

  // Handle payment button clicks
  if (interaction.isButton() && interaction.customId.startsWith('payment_')) {
    const [, paymentType, tier] = interaction.customId.split('_');

    await interaction.reply({
      content: '⏳ Generating your payment link... Please wait.',
      ephemeral: true
    });

    // Import stripe here to create checkout session
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const tierConfig = config.roles[tier];
    const guildId = interaction.guild.id;

    try {
      // Get connected account for this guild
      const connectedAccount = await db.getConnectedAccountByGuildId(guildId);

      if (!connectedAccount || !connectedAccount.chargesEnabled) {
        await interaction.editReply({
          content: '❌ This server has not completed Stripe setup yet. Please contact the server owner.',
          ephemeral: true
        });
        return;
      }

      // Get the price amount
      const priceAmount = paymentType === 'onetime'
        ? tierConfig.oneTime.price
        : tierConfig.subscription.monthlyPrice;

      // Calculate platform fee (3%)
      const platformFee = Math.round(priceAmount * 100 * 0.03); // In cents

      // Create Stripe Checkout Session with destination charge
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: paymentType === 'onetime'
              ? tierConfig.oneTime.stripePriceId
              : tierConfig.subscription.stripePriceId,
            quantity: 1,
          },
        ],
        mode: paymentType === 'onetime' ? 'payment' : 'subscription',
        success_url: `${process.env.WEBHOOK_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.WEBHOOK_URL}/cancel`,
        client_reference_id: interaction.user.id,
        payment_intent_data: paymentType === 'onetime' ? {
          application_fee_amount: platformFee,
          transfer_data: {
            destination: connectedAccount.stripeAccountId,
          },
        } : undefined,
        subscription_data: paymentType === 'subscription' ? {
          application_fee_percent: 3,
          transfer_data: {
            destination: connectedAccount.stripeAccountId,
          },
        } : undefined,
        metadata: {
          discordUserId: interaction.user.id,
          guildId: guildId,
          tier: tier,
          paymentType: paymentType
        }
      });

      await interaction.editReply({
        content: `✅ Payment link generated!\n\n[Click here to complete your payment](${session.url})\n\nYour role will be automatically assigned after successful payment.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      await interaction.editReply({
        content: '❌ There was an error generating your payment link. Please try again or contact support.',
        ephemeral: true
      });
    }
  }
  } catch (error) {
    console.error('Error handling interaction:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ An error occurred. Please try again.',
        ephemeral: true
      }).catch(console.error);
    }
  }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

module.exports = client;
