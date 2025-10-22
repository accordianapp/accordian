require('dotenv').config();
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

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
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
