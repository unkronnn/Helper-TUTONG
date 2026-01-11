const { ChannelType } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  name: 'guildMemberAdd',
  execute(member) {
    // Auto-update handled by interval in ready.js
  }
};
