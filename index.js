require('dotenv').config();

console.log('Discord Payment Bot is starting...');
console.log('Make sure you have configured your .env file!');

// Register slash commands on startup
const { REST, Routes } = require('discord.js');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('setup-stripe')
    .setDescription('Connect your Stripe account to start accepting payments')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),
  new SlashCommandBuilder()
    .setName('stripe-status')
    .setDescription('Check your Stripe account connection status')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),
  new SlashCommandBuilder()
    .setName('platform-stats')
    .setDescription('View platform statistics (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands },
    );
    console.log('✅ Slash commands registered successfully');
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
  }
})();

// Start the webhook server
require('./server');

// The bot is started in bot.js (imported by server.js)
