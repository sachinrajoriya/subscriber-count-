const { Telegraf } = require('telegraf');

// Bot token (keep this secure)
const bot = new Telegraf('7553319687:AAEC4ctbEYomz-37d0sZkTIip1jMeY9JtKI');

// Channel numeric ID (replace with your channel's ID)
const channelId = '@adultparodies';

// Target subscriber count
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
  const text = `Current Subscribers: ${currentCount}\nSubscribers needed to reach ${targetSubscribers}: ${remaining > 0 ? remaining : 0}\n\nPlease show your support share this link: t.me/adultparodies`;
  
  if (messageId) {
    try {
      await bot.telegram.editMessageText(channelId, messageId, null, text);
      console.log('Message edited with new count:', currentCount);
    } catch (error) {
      // Ignore the error if the message is not modified
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

// Command to start subscriber count updates
bot.command('start_updates', async (ctx) => {
  // Immediately send the initial update
  await updateSubscriberMessage();
  ctx.reply('Subscriber count updates have started.');
  
  // Poll every 5 seconds (adjust interval as needed)
  setInterval(updateSubscriberMessage, 5000);
});

// Launch the bot
bot.launch();
