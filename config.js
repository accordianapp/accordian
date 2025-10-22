// Configuration for role tiers and pricing
module.exports = {
  // Server Settings
  serverSettings: {
    paymentLogChannelId: '1430416611046588498', // Channel where payment receipts are posted
    memberDashboardChannelId: '1430419261872013393', // Channel for live member list
    welcomeMessage: 'Hey {username}! Welcome to our community.\n\nTo get started, please select your membership tier below.',
    paymentSuccessMessage: '✅ Payment successful! Your **{tier}** role has been activated.\n\nThank you for your support!',
  },

  // Role Tiers Configuration
  roles: {
    basic: {
      name: 'Basic Member',
      roleId: '1430401898682515456',
      description: 'Access to basic channels and features',
      oneTime: {
        price: 9.99,
        stripePriceId: 'price_1SKt4GChgZ0yaO7UoSnxlGcj'
      },
      subscription: {
        monthlyPrice: 4.99,
        stripePriceId: 'price_1SKt74ChgZ0yaO7U8CJFgdfg'
      }
    }
  }
};
