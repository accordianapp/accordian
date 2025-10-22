require('dotenv').config();

// Start the webhook server
require('./server');

// The bot is started in bot.js
console.log('Discord Payment Bot is starting...');
console.log('Make sure you have configured your .env file!');
