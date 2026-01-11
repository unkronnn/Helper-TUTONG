const { ChannelType } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  name: 'guildMemberRemove',
  execute(member) {
    // Auto-update handled by interval in ready.js
  }
};
