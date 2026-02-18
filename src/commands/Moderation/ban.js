// src/slashCommands/Moderation/ban.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for ban (optional')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  /**
   * @param {import('discord.js').Client} client 
   * @param {import('discord.js').CommandInteraction} interaction 
   */
  run: async (client, interaction) => {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guild = interaction.guild;

    try {
      // Check if user has permission
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Kamu tidak memiliki permission untuk ban member');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      // Check if bot can ban
      if (!guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Bot tidak memiliki permission untuk ban member');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      // Cannot ban yourself
      if (targetUser.id === interaction.user.id) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Kamu tidak bisa ban dirimu sendiri');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      // Cannot ban owner
      if (targetUser.id === guild.ownerId) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Kamu tidak bisa ban owner server');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      await guild.bans.create(targetUser, { reason: reason, deleteMessageSeconds: 0 });

      // Send DM to user
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('Banned')
          .setDescription(`You have been banned from **${guild.name}**.`)
          .addFields(
            { name: 'Reason', value: reason || 'No reason provided', inline: false }
          )
          .setFooter({ text: `Moderator: ${interaction.user.username}` })
          .setTimestamp();

        await targetUser.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        console.log(`Could not DM ${targetUser.username}`);
      }

      const successEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('User Banned')
        .setDescription('The ban hammer has spoken!')
        .addFields(
          { name: 'User', value: `<@${targetUser.id}>`, inline: false },
          { name: 'Banned by', value: `<@${interaction.user.id}>`, inline: false },
          { name: 'Reason', value: reason || 'No reason provided', inline: false }
        );

      await interaction.reply({
        embeds: [successEmbed],
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setDescription('❌ Terjadi kesalahan saat mem-ban user');

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
    }
  }
};
