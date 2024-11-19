# Parrot

A Discord bot that helps monitor and forward messages between channels. Perfect for message monitoring, forwarding, and automated moderation across multiple channels and guilds.

## Why Parrot?

Parrot monitors specific users' messages in designated channels and forwards them to separate channels, allowing members to:
- Track messages from specific users without receiving notifications
- Review messages in a dedicated channel
- Jump back to original messages with one click

# Usages
## 机器人命令

`!help` - 显示帮助信息。

`!addmonitor` <用户名> <频道名称> - 为指定用户开始监控指定频道的消息。

`!removemonitor` <用户名> <频道名称> - 停止监控为指定用户设定的频道。

`!settarget` <用户名> <频道名称> - 为指定用户设置消息转发的目标频道。

`!status` <用户名> - 显示指定用户的当前状态，包括监控的频道和目标频道。

注意：命令中需要包含用户名，以配置或查看特定用户的设置。

## Bot Commands
`!help` - Displays this help message.

`!addmonitor` <username> <channel-name> - Start monitoring messages in a specified channel for a specified user.

`!removemonitor` <username> <channel-name> - Stop monitoring messages in a specified channel for a specified user.

`!settarget` <username> <channel-name> - Set the target channel for forwarding messages for a specified user.

`!status` <username> - Show current status for a specified user, including monitored channels and target channel.

Note: Commands need to include the username for which the settings are to be configured or viewed.

# Parrot management
To keep your Discord bot running 24/7, even after you exit the SSH session on your server, you'll need to use a process manager that can handle the lifecycle of your Node.js application. A common tool for this purpose is PM2, which is a powerful, production-ready process manager for Node.js applications that allows them to run in the background as a service.

Here’s how to set up PM2 to manage your Discord bot:

Step 1: Install PM2
First, you need to install PM2 on your server. You can do this globally using npm:

`npm install pm2 -g`


Step 2: Start Your Bot with PM2
Navigate to the directory where your bot’s code is located (where your bot.js file is), and start it using PM2:


`pm2 start bot.js --name "discord-bot"`
This command will start your bot under the name "discord-bot", which makes it easier to manage using PM2. PM2 will automatically restart your bot if it crashes and will keep it running in the background.


Step 3: Configure PM2 to Auto-Start at Boot
To ensure that your bot starts automatically after a reboot, you can set up PM2 to resurrect your processes on startup:

`pm2 startup`
This command will generate a line of code that you need to execute with superuser privileges. Follow the instructions provided in the output of the pm2 startup command.


Step 4: Save Your PM2 Process List
After setting up the processes you want PM2 to manage, save the list:

`pm2 save`
This command saves the current list of processes so that they can be reloaded automatically on reboot or if PM2 is restarted.

Step 5: Managing Your Bot with PM2
PM2 provides several commands to help manage your application:

# Useful commands
Check Status: `pm2 status` will show you the status of all processes managed by PM2.

Stop an Application: `pm2 stop discord-bot` will stop the bot.

Restart an Application: `pm2 restart discord-bot` will restart the bot.

View Logs: `pm2 logs discord-bot` will show logs for your bot, which is useful for debugging.

# Additional Tips
Update Your Bot: When you make changes to your bot’s code, you’ll need to restart it with PM2 to apply those changes: `pm2 restart discord-bot`.
Monitor Your Bot: Use `pm2 monit` to monitor the CPU and memory usage of your applications managed by PM2.
