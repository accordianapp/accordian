// Test script to manually trigger dashboard update
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { updateMemberDashboard } = require('./dashboard');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ]
});

client.once('ready', async () => {
  console.log('Bot connected! Triggering dashboard update...');

  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    console.log(`Fetched guild: ${guild.name}`);

    await updateMemberDashboard(guild);
    console.log('✅ Dashboard update complete!');
    console.log('Check your dashboard channel to see the results.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating dashboard:', error);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
