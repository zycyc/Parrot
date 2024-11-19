const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const token = process.env.DISCORD_TOKEN;
let settings = {};


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.guilds.cache.forEach(guild => {
      loadSettings(guild.id);
  });
});

client.on('messageCreate', async message => {
  if (message.author.bot) return; // Ignore bot messages

  /////////////////////////////// Start Monitoring for @
  const guildSettings = settings[message.guild.id] || {};
  const doNotMentionList = guildSettings.doNotMentionList || [];

  // Checking if any of the mentioned users are in the do not mention list
  const mentionedUserIds = message.mentions.users.map(user => user.id);
  const isForbiddenMention = mentionedUserIds.some(userId => {
    const usernames = Array.from(message.guild.usernameToIdMap.entries())
                            .filter(([username, id]) => id === userId)
                            .map(([username]) => username);
    return usernames.some(username => doNotMentionList.includes(username.toLowerCase()));
  });

  if (isForbiddenMention && !message.reference) {
    await message.delete();
    return message.channel.send(`A message from ${message.author.username} was deleted for mentioning a user on the do not mention list.`);
  }
  /////////////////////////////// End Monitoring for @

  const commands = {
    '!help': () => sendHelp(message),
    '!addDoNotMention': () => addDoNotMentionUser(message),
    '!removeDoNotMention': () => removeDoNotMentionUser(message),
    '!addmonitor': () => addMonitor(message),
    '!removemonitor': () => removeMonitor(message),
    '!settarget': () => setTarget(message),
    '!status': () => sendStatus(message)
  };

  const command = message.content.split(' ')[0];
  if (commands[command]) {
    commands[command]();
  } else {
    forwardMessage(message);
  }
});

function loadSettings(guildId) {
  try {
      const rawData = fs.readFileSync(`settings_${guildId}.json`, 'utf8');
      settings[guildId] = JSON.parse(rawData);
      console.log(`Settings loaded successfully for guild ${guildId}`);
  } catch (error) {
      console.log(`Failed to load settings for guild ${guildId}: ${error}`);
      settings[guildId] = {}; // Initialize empty settings if loading fails
  }
}

function saveSettings(guildId) {
  fs.writeFileSync(`settings_${guildId}.json`, JSON.stringify(settings[guildId], null, 4), 'utf8');
}

function sendHelp(message) {
  const helpMessage = `
    **Bot Commands**
    \`!help\` - Displays this help message.
    \`!addDoNotMention <userID>\` - Add a user to the do not mention list by their ID.
    \`!removeDoNotMention <userID>\` - Remove a user from the do not mention list by their ID.
    \`!addmonitor <username> <channel-name>\` - Start monitoring messages in a specified channel for a specified user.
    \`!removemonitor <username> <channel-name>\` - Stop monitoring messages in a specified channel for a specified user.
    \`!settarget <username> <channel-name>\` - Set the target channel for forwarding messages for a specified user.
    \`!status <username>\` - Show current status for a specified user, including monitored channels and target channel.
    `;
  message.channel.send(helpMessage);
}

// Add user to the do not mention list and update the map
async function addDoNotMentionUser(message) {
  const [_, username] = message.content.split(' ');
  settings[message.guild.id].doNotMentionList = settings[message.guild.id].doNotMentionList || [];
  if (!settings[message.guild.id].doNotMentionList.includes(username.toLowerCase())) {
    settings[message.guild.id].doNotMentionList.push(username.toLowerCase());
    await updateUsernameToIdMap(message.guild);
    saveSettings(message.guild.id);
    message.channel.send(`${username} added to the do not mention list.`);
  } else {
    message.channel.send(`${username} is already in the do not mention list.`);
  }
  displayDoNotMentionList(message);
}

// Remove user from the do not mention list and update the map
async function removeDoNotMentionUser(message) {
  const [_, username] = message.content.split(' ');
  if (settings[message.guild.id].doNotMentionList && settings[message.guild.id].doNotMentionList.includes(username.toLowerCase())) {
    const index = settings[message.guild.id].doNotMentionList.indexOf(username.toLowerCase());
    settings[message.guild.id].doNotMentionList.splice(index, 1);
    await updateUsernameToIdMap(message.guild);
    saveSettings(message.guild.id);
    message.channel.send(`${username} removed from the do not mention list.`);
  } else {
    message.channel.send(`${username} is not in the do not mention list.`);
  }
  displayDoNotMentionList(message);
}

// Function to display the current do not mention list
function displayDoNotMentionList(message) {
  const doNotMentionList = settings[message.guild.id].doNotMentionList || [];
  message.channel.send(`Current do not mention list: ${doNotMentionList.join(', ')}`);
}

async function updateUsernameToIdMap(guild) {
  const doNotMentionList = settings[guild.id].doNotMentionList || [];
  // Clear the previous map to avoid stale entries
  guild.usernameToIdMap = new Map();

  for (const username of doNotMentionList) {
    // Attempt to find each user in the guild member list
    try {
      let member = await guild.members.fetch({ query: username, limit: 1 });
      if (member.size > 0) {
        member = member.first();
        guild.usernameToIdMap.set(username, member.user.id); // Store the user ID in the map
      } else {
        console.log(`User not found: ${username}`);
      }
    } catch (error) {
      console.error(`Error fetching user ${username}: ${error}`);
    }
  }
}


function addMonitor(message) {
  const [_, username, channelName] = message.content.split(' ');
  if (!settings[message.guild.id][username]) {
    settings[message.guild.id][username] = { monitoredChannels: [], targetChannel: "" };
  }
  const channel = message.guild.channels.cache.find(ch => ch.name === channelName);
  if (channel) {
    settings[message.guild.id][username].monitoredChannels.push(channel.id);
    message.channel.send(`Now monitoring ${channelName} for ${username}.`);
    saveSettings(message.guild.id);
  } else {
    message.channel.send(`Channel ${channelName} not found.`);
  }
}

function removeMonitor(message) {
  const [_, username, channelName] = message.content.split(' ');
  const channel = message.guild.channels.cache.find(ch => ch.name === channelName);
  if (channel && settings[message.guild.id][username]) {
    const index = settings[message.guild.id][username].monitoredChannels.indexOf(channel.id);
    if (index !== -1) {
      settings[message.guild.id][username].monitoredChannels.splice(index, 1);
      message.channel.send(`Stopped monitoring ${channelName} for ${username}.`);
      saveSettings(message.guild.id);
    } else {
      message.channel.send(`Channel ${channelName} not being monitored for ${username}.`);
    }
  } else {
    message.channel.send(`Channel ${channelName} not found or not monitored for ${username}.`);
  }
}

function setTarget(message) {
  const [_, username, channelName] = message.content.split(' ');
  const channel = message.guild.channels.cache.find(ch => ch.name === channelName);
  if (channel) {
    if (!settings[message.guild.id][username]) {
      settings[message.guild.id][username] = { monitoredChannels: [], targetChannel: "" };
    }
    settings[message.guild.id][username].targetChannel = channel.id;
    message.channel.send(`Target channel for ${username} set to ${channelName}.`);
    saveSettings(message.guild.id);
  } else {
    message.channel.send("Please provide a valid channel name.");
  }
}

function sendStatus(message) {
  const username = message.content.split(' ')[1];
  const userSettings = settings[message.guild.id][username];
  if (userSettings) {
    const monitoredChannels = userSettings.monitoredChannels.map(id => message.guild.channels.cache.get(id)?.name).join(', ') || 'None';
    const targetChannelName = message.guild.channels.cache.get(userSettings.targetChannel)?.name || 'None';
    const statusMessage = `
      **Bot Status for ${username}**
      **Monitored Channels:** ${monitoredChannels}
      **Target Channel:** ${targetChannelName}
    `;
    message.channel.send(statusMessage);
  } else {
    message.channel.send(`No settings found for ${username}.`);
  }
}

function forwardMessage(message) {
  Object.entries(settings[message.guild.id]).forEach(([username, userSettings]) => {
    if (message.author.username === username) {
      if (userSettings.monitoredChannels.includes(message.channel.id)) {
        const targetChannel = message.guild.channels.cache.get(userSettings.targetChannel);
        if (targetChannel) {
          const messageLink = `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;
          const displayName = message.member ? message.member.displayName : message.author.username;

          let gif = false;

          // Handle embeds and links
          if (message.embeds.length > 0) {
            message.embeds.forEach(embed => {
              if (embed.type === 'image' || embed.video) {
                let contentUrl = embed.thumbnail?.url || embed.image?.url || embed.video?.url || '';
                if (embed.url && embed.url.includes('tenor.com')) {
                  contentUrl = embed.url;
                  gif = true;
                }
                targetChannel.send(`[Message from ${displayName}:](${messageLink}) ${contentUrl}`);
              }
            });
          }

          // Handle attachments specifically
          if (message.attachments.size > 0) {
            message.attachments.forEach(attachment => {
              const attachmentUrl = attachment.url;
              targetChannel.send(`["Attachment from ${displayName}:"](${messageLink}) ${attachmentUrl}`);
            });
          }

          // Forward text only if it's the sole content
          if (message.content && !gif) {
            targetChannel.send(`[Message from ${displayName}:](${messageLink}) "${message.content}"`);
          }
        }
      }
    }
  });
}


client.login(token);