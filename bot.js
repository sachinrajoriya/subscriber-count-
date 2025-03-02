const express = require('express');
const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const app = express();

// Channel ID and target subscriber count
const channelId = '@adultparodies';
const targetSubscribers = 1000;

// Global variables to track last count and the message ID
let lastCount = null;
let messageId = null;

// Function to fetch current subscriber count using getChatMembersCount
const getSubscriberCount = async () => {
  try {
    const count = await bot.telegram.getChatMembersCount(channelId);
    return count;
  } catch (error) {
    console.error('Error fetching subscriber count:', error);
    return null;
  }
};

// Function to update the subscriber message only if the count changes
const updateSubscriberMessage = async () => {
  const currentCount = await getSubscriberCount();
  if (currentCount === null) return;
  
  // If subscriber count hasn't changed, do nothing
  if (lastCount !== null && currentCount === lastCount) {
    console.log('Subscriber count unchanged.');
    return;
  }
  
  lastCount = currentCount;
  const remaining = targetSubscribers - currentCount;
  const text = `Current Subscribers: ${currentCount}\nSubscribers needed to reach ${targetSubscribers}: ${remaining > 0 ? remaining : 0}\n\nPlease show your support, share this link: t.me/adultparodies`;
  
  if (messageId) {
    try {
      await bot.telegram.editMessageText(channelId, messageId, null, text);
      console.log('Message edited with new count:', currentCount);
    } catch (error) {
      // Ignore error if message is not modified
      if (
        error.response &&
        error.response.description &&
        error.response.description.includes("message is not modified")
      ) {
        console.log("No change in message content; not modified.");
      } else {
        console.error("Error editing message:", error);
      }
    }
  } else {
    try {
      const sentMessage = await bot.telegram.sendMessage(channelId, text);
      messageId = sentMessage.message_id;
      console.log('New message sent with count:', currentCount);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
};

// Set up webhook callback for Telegram updates at "/webhook"
app.use(bot.webhookCallback('/webhook'));

// Command to start subscriber count updates
bot.command('start_updates', async (ctx) => {
  // Send an immediate update
  await updateSubscriberMessage();
  // Inform the user to schedule periodic calls to the /update endpoint
  ctx.reply('Subscriber count update initiated. Please schedule periodic calls to the /update endpoint (e.g., using a cron job).');
});

// Expose an endpoint to trigger the update manually (for scheduled pings)
app.get('/update', async (req, res) => {
  await updateSubscriberMessage();
  res.send('Subscriber update executed.');
});

// Set the webhook using the WEBHOOK_URL environment variable
const webhookUrl = process.env.WEBHOOK_URL; // e.g., "https://your-app.vercel.app"
if (webhookUrl) {
  bot.telegram.setWebhook(webhookUrl + '/webhook')
    .then(() => console.log('Webhook set successfully'))
    .catch(err => console.error('Error setting webhook:', err));
} else {
  console.error('WEBHOOK_URL is not set in environment variables.');
}

module.exports = app;
