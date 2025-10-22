const { EmbedBuilder } = require('discord.js');
const config = require('./config');
const db = require('./database');

let dashboardMessageId = null;

// Update the member dashboard
async function updateMemberDashboard(guild) {
  try {
    const channelId = config.serverSettings.memberDashboardChannelId;
    if (!channelId || channelId === 'REPLACE_WITH_DASHBOARD_CHANNEL_ID') {
      console.log('Member dashboard channel not configured, skipping update');
      return;
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      console.error(`Dashboard channel ${channelId} not found`);
      return;
    }

    // Get all active payments
    const activePayments = await db.getActivePayments();

    // Group members by tier
    const membersByTier = {};
    for (const tierKey in config.roles) {
      membersByTier[tierKey] = {
        oneTime: [],
        subscription: []
      };
    }

    // Fetch all members with roles
    await guild.members.fetch();

    for (const payment of activePayments) {
      try {
        const member = await guild.members.fetch(payment.userId).catch(() => null);
        if (!member) continue;

        const tier = payment.tier;
        const roleId = config.roles[tier]?.roleId;

        // Check if member still has the role
        if (roleId && member.roles.cache.has(roleId)) {
          const memberData = {
            tag: member.user.tag,
            id: member.user.id,
            amount: payment.amount,
            date: new Date(payment.createdAt)
          };

          if (payment.paymentType === 'onetime') {
            membersByTier[tier].oneTime.push(memberData);
          } else {
            membersByTier[tier].subscription.push(memberData);
          }
        }
      } catch (error) {
        console.error(`Error processing payment for user ${payment.userId}:`, error);
      }
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📊 Active Members Dashboard')
      .setDescription('Live overview of all active paid members')
      .setTimestamp()
      .setFooter({ text: 'Updates automatically when members join or leave' });

    // Add fields for each tier
    for (const tierKey in config.roles) {
      const tierConfig = config.roles[tierKey];
      const tierMembers = membersByTier[tierKey];

      // One-time members
      if (tierMembers.oneTime.length > 0) {
        const memberList = tierMembers.oneTime
          .map(m => `• <@${m.id}> - $${m.amount.toFixed(2)} (Lifetime)`)
          .join('\n');

        embed.addFields({
          name: `${tierConfig.name} - One-time (${tierMembers.oneTime.length})`,
          value: memberList.substring(0, 1024), // Discord field limit
          inline: false
        });
      }

      // Subscription members
      if (tierMembers.subscription.length > 0) {
        const memberList = tierMembers.subscription
          .map(m => `• <@${m.id}> - $${m.amount.toFixed(2)}/mo`)
          .join('\n');

        embed.addFields({
          name: `${tierConfig.name} - Subscription (${tierMembers.subscription.length})`,
          value: memberList.substring(0, 1024), // Discord field limit
          inline: false
        });
      }
    }

    // Calculate totals
    const totalMembers = activePayments.length;
    const totalRevenue = activePayments.reduce((sum, p) => sum + p.amount, 0);
    const subscriptionCount = activePayments.filter(p => p.paymentType === 'subscription').length;

    embed.addFields({
      name: '📈 Statistics',
      value: [
        `**Total Active Members:** ${totalMembers}`,
        `**Subscription Members:** ${subscriptionCount}`,
        `**Total Revenue:** $${totalRevenue.toFixed(2)}`,
        `**MRR (Monthly Recurring):** $${activePayments.filter(p => p.paymentType === 'subscription').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}`
      ].join('\n'),
      inline: false
    });

    // If no members yet
    if (totalMembers === 0) {
      embed.setDescription('No active paid members yet. The dashboard will update automatically when someone subscribes!');
    }

    // Update or create message
    if (dashboardMessageId) {
      try {
        const message = await channel.messages.fetch(dashboardMessageId);
        await message.edit({ embeds: [embed] });
        console.log('Dashboard updated successfully');
      } catch (error) {
        // Message was deleted, create new one
        const newMessage = await channel.send({ embeds: [embed] });
        dashboardMessageId = newMessage.id;
        console.log('Dashboard message recreated');
      }
    } else {
      // First time or message doesn't exist
      // Try to find existing dashboard message
      const messages = await channel.messages.fetch({ limit: 10 });
      const existingDashboard = messages.find(m =>
        m.author.id === guild.members.me.id &&
        m.embeds[0]?.title === '📊 Active Members Dashboard'
      );

      if (existingDashboard) {
        dashboardMessageId = existingDashboard.id;
        await existingDashboard.edit({ embeds: [embed] });
        console.log('Found and updated existing dashboard');
      } else {
        const newMessage = await channel.send({ embeds: [embed] });
        dashboardMessageId = newMessage.id;
        console.log('Created new dashboard message');
      }
    }
  } catch (error) {
    console.error('Error updating member dashboard:', error);
  }
}

module.exports = {
  updateMemberDashboard
};
