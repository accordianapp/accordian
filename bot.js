require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config');

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

// Handle role selection
client.on('interactionCreate', async (interaction) => {
  try {
    console.log(`Received interaction: ${interaction.customId}`);

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

    try {
      // Create Stripe Checkout Session
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
        metadata: {
          discordUserId: interaction.user.id,
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
