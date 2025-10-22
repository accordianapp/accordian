# Discord Payment Bot - Deployment Guide

This guide will walk you through deploying your Discord payment bot to production.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have completed the following:

### ✅ Discord Setup (Complete)
- [x] Discord bot created at https://discord.com/developers/applications
- [x] Bot token obtained
- [x] Bot invited to your server with proper permissions (Manage Roles, Send Messages, Read Messages)
- [x] Privileged Gateway Intents enabled (SERVER MEMBERS INTENT, MESSAGE CONTENT INTENT)
- [x] All role IDs copied (Basic, Premium, VIP, etc.)
- [x] Bot's role positioned ABOVE member roles in server hierarchy
- [x] Payment log channel created and ID copied
- [x] Member dashboard channel created and ID copied

### ✅ Stripe Setup (Complete)
- [x] Stripe account created at https://stripe.com
- [x] Products created for each membership tier
- [x] Price IDs created (both one-time and subscription for each tier)
- [x] All Price IDs copied and added to `config.js`
- [x] Stripe webhook endpoint created (will update URL after deployment)

### ✅ Local Testing (Complete)
- [x] Bot tested locally with ngrok
- [x] Test payments processed successfully using Stripe test cards
- [x] Roles assigned automatically after payment
- [x] Payment receipts posting to log channel
- [x] Member dashboard updating correctly
- [x] Subscription cancellations working

### ✅ Code Preparation
- [x] All configuration in `config.js` updated with production values
- [x] `.env.example` file present for server owners
- [x] `.gitignore` includes `.env` to prevent committing secrets
- [x] All dependencies listed in `package.json`

---

## 🚀 Deployment Options

Choose one of the following deployment platforms:

### Option 1: Railway (Recommended - Easiest)

**Why Railway?**
- Free tier available
- Automatic deployments from GitHub
- Built-in SSL/HTTPS
- Easy environment variable management
- No credit card required for free tier

**Pricing:**
- Free: $5 of usage per month
- Pro: $20/month + usage

**Steps:**

1. **Prepare GitHub Repository**
   ```bash
   cd ~/Documents/discord-payment-bot
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create GitHub Repository**
   - Go to https://github.com/new
   - Create a new repository (e.g., "discord-payment-bot")
   - Don't initialize with README (we already have files)
   - Copy the repository URL

3. **Push Code to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/discord-payment-bot.git
   git branch -M main
   git push -u origin main
   ```

4. **Deploy to Railway**
   - Go to https://railway.app
   - Sign up/Login with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your discord-payment-bot repository
   - Railway will auto-detect it's a Node.js app

5. **Add Environment Variables**
   - In Railway dashboard, go to your project
   - Click on the service
   - Go to "Variables" tab
   - Add each variable from your `.env` file:
     ```
     DISCORD_TOKEN=your_actual_token
     DISCORD_CLIENT_ID=your_client_id
     GUILD_ID=your_server_id
     STRIPE_SECRET_KEY=your_live_stripe_key
     STRIPE_WEBHOOK_SECRET=your_webhook_secret
     PORT=3000
     WEBHOOK_URL=https://your-railway-domain.railway.app
     ```

6. **Get Your Railway URL**
   - In Railway dashboard, go to "Settings"
   - Under "Networking", click "Generate Domain"
   - Copy your railway.app URL (e.g., `https://discord-payment-bot-production.up.railway.app`)

7. **Update WEBHOOK_URL**
   - In Railway Variables, update `WEBHOOK_URL` to your Railway domain
   - Railway will auto-redeploy

8. **Update Stripe Webhook**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Update your webhook endpoint URL to: `https://your-railway-domain.railway.app/webhook`

---

### Option 2: Heroku

**Why Heroku?**
- Well-documented
- Easy to use
- Good for beginners

**Pricing:**
- Eco Dynos: $5/month (doesn't sleep)
- Basic: $7/month

**Steps:**

1. **Install Heroku CLI**
   ```bash
   brew install heroku/brew/heroku
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   cd ~/Documents/discord-payment-bot
   git init
   git add .
   git commit -m "Initial commit"
   heroku create your-bot-name
   ```

4. **Add Procfile**
   Create a file named `Procfile` (no extension) with:
   ```
   web: node index.js
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set DISCORD_TOKEN=your_token
   heroku config:set DISCORD_CLIENT_ID=your_client_id
   heroku config:set GUILD_ID=your_server_id
   heroku config:set STRIPE_SECRET_KEY=your_live_key
   heroku config:set STRIPE_WEBHOOK_SECRET=your_webhook_secret
   heroku config:set PORT=3000
   heroku config:set WEBHOOK_URL=https://your-bot-name.herokuapp.com
   ```

6. **Deploy**
   ```bash
   git push heroku main
   ```

7. **Update Stripe Webhook**
   - Update webhook URL to: `https://your-bot-name.herokuapp.com/webhook`

---

### Option 3: DigitalOcean (Most Control)

**Why DigitalOcean?**
- Full server control
- Can run multiple bots on one droplet
- Good performance

**Pricing:**
- Basic Droplet: $6/month
- Recommended: $12/month (2GB RAM)

**Steps:**

1. **Create Droplet**
   - Go to https://digitalocean.com
   - Create account
   - Create a Droplet (Ubuntu 22.04 LTS recommended)
   - Choose plan ($6 or $12/month)
   - Add SSH key for secure access

2. **SSH into Server**
   ```bash
   ssh root@your_droplet_ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo apt-get install -y build-essential
   ```

4. **Install PM2 (Process Manager)**
   ```bash
   sudo npm install -g pm2
   ```

5. **Upload Bot Files**
   ```bash
   # On your local machine:
   scp -r ~/Documents/discord-payment-bot root@your_droplet_ip:/root/
   ```

6. **Set Up Bot on Server**
   ```bash
   # On the server:
   cd /root/discord-payment-bot
   npm install
   ```

7. **Create .env File**
   ```bash
   nano .env
   ```

   Add your environment variables:
   ```
   DISCORD_TOKEN=your_token
   DISCORD_CLIENT_ID=your_client_id
   GUILD_ID=your_server_id
   STRIPE_SECRET_KEY=your_live_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   PORT=3000
   WEBHOOK_URL=https://your_domain.com
   ```

8. **Install and Configure Nginx (Web Server)**
   ```bash
   sudo apt-get install -y nginx
   sudo nano /etc/nginx/sites-available/discord-bot
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your_domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/discord-bot /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **Install SSL Certificate (HTTPS)**
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your_domain.com
   ```

10. **Start Bot with PM2**
    ```bash
    cd /root/discord-payment-bot
    pm2 start index.js --name discord-payment-bot
    pm2 save
    pm2 startup
    ```

11. **Update Stripe Webhook**
    - Update to: `https://your_domain.com/webhook`

---

## 🔐 Security Checklist

Before going live:

- [ ] **Never commit .env file** - Verify it's in `.gitignore`
- [ ] **Use strong secrets** - All tokens and keys should be secure
- [ ] **Enable 2FA** on Discord Developer Portal
- [ ] **Enable 2FA** on Stripe account
- [ ] **Restrict bot permissions** - Only give necessary permissions
- [ ] **Monitor logs** - Set up log monitoring on your deployment platform
- [ ] **Backup database** - Regularly backup `payments.json` file
- [ ] **Use environment variables** - Never hardcode secrets in code

---

## 🧪 Post-Deployment Testing

After deployment:

1. **Test Bot Connection**
   - Check logs to confirm bot is online
   - Verify bot shows as online in Discord server

2. **Test Payment Flow**
   - Have a test account join the server
   - Go through the payment process with a real card (small amount)
   - Verify role is assigned
   - Check payment receipt appears in log channel
   - Check member dashboard updates

3. **Test Webhooks**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Check webhook logs for successful deliveries
   - If seeing errors, check your server logs

4. **Test Subscription Cancellation**
   - In Stripe Dashboard, cancel a test subscription
   - Verify role is removed from Discord
   - Check dashboard updates

---

## 📊 Monitoring & Maintenance

### Railway
- View logs in Railway dashboard
- Monitor resource usage
- Set up notifications for downtime

### Heroku
```bash
heroku logs --tail
heroku ps
```

### DigitalOcean
```bash
pm2 logs discord-payment-bot
pm2 status
```

### Database Backups

Regularly backup your `payments.json` file:

**Railway/Heroku:**
- Use persistent storage add-ons
- Or export database via API

**DigitalOcean:**
```bash
# Create backup script
crontab -e

# Add this line to backup daily at 2 AM:
0 2 * * * cp /root/discord-payment-bot/payments.json /root/backups/payments-$(date +\%Y\%m\%d).json
```

---

## 🆘 Troubleshooting

### Bot Not Coming Online
1. Check logs for errors
2. Verify DISCORD_TOKEN is correct
3. Ensure all intents are enabled
4. Check server has internet access

### Payments Not Processing
1. Check Stripe webhook logs
2. Verify STRIPE_WEBHOOK_SECRET is correct
3. Ensure webhook URL is correct (include /webhook path)
4. Check server logs for errors

### Roles Not Assigning
1. Verify bot role is ABOVE member roles
2. Check role IDs in config.js are correct
3. Ensure bot has "Manage Roles" permission
4. Check server logs for permission errors

### Dashboard Not Updating
1. Verify channel ID is correct
2. Ensure bot can send messages in that channel
3. Run `npm run test-dashboard` to manually trigger update
4. Check logs for errors

---

## 🔄 Updates & Maintenance

### Updating Bot Code

**Railway/Heroku (GitHub):**
```bash
git add .
git commit -m "Update bot"
git push origin main
```
Auto-deploys on push!

**DigitalOcean:**
```bash
# On server:
cd /root/discord-payment-bot
git pull origin main
npm install
pm2 restart discord-payment-bot
```

### Updating Environment Variables

**Railway:** Update in dashboard Variables tab
**Heroku:** `heroku config:set VAR_NAME=value`
**DigitalOcean:** Edit `.env` file and restart PM2

---

## 💡 Best Practices

1. **Use Live Mode Keys Only in Production** - Keep test and live environments separate
2. **Monitor Stripe Events** - Regularly check webhook logs
3. **Keep Dependencies Updated** - Run `npm outdated` and update packages
4. **Backup Regularly** - Automate database backups
5. **Monitor Uptime** - Use services like UptimeRobot (free)
6. **Document Changes** - Keep track of configuration changes
7. **Test Before Deploying** - Always test locally first

---

## 📞 Support Resources

- **Discord Developer Docs:** https://discord.com/developers/docs
- **Stripe Docs:** https://stripe.com/docs
- **Railway Docs:** https://docs.railway.app
- **Heroku Docs:** https://devcenter.heroku.com
- **DigitalOcean Docs:** https://docs.digitalocean.com

---

**You're ready to deploy!** Choose your platform and follow the steps above. Good luck! 🚀
