const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to kick')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for kick (optional')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

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
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Kamu tidak memiliki permission untuk kick member');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      // Check if bot can kick
      if (!guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Bot tidak memiliki permission untuk kick member');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      // Cannot kick yourself
      if (targetUser.id === interaction.user.id) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Kamu tidak bisa kick dirimu sendiri');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      // Cannot kick owner
      if (targetUser.id === guild.ownerId) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Kamu tidak bisa kick owner server');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      const targetMember = await guild.members.fetch(targetUser.id);

      // Check role hierarchy - bot can't kick members with equal or higher roles
      if (targetMember.roles.highest.position >= guild.members.me.roles.highest.position) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Bot tidak bisa kick member dengan role yang sama atau lebih tinggi');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }
      await targetMember.kick(reason);

      // Send DM to user
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('Kicked')
          .setDescription(`You have been kicked from **${guild.name}**.`)
          .addFields(
            { name: 'Reason', value: reason || 'No reason provided', inline: false }
          )
          .setFooter({ text: `Moderator: ${interaction.user.username}` })
          .setTimestamp();

        await targetUser.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        logger.info(`Could not DM ${targetUser.username}`);
      }

      const successEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('User Kicked')
        .setDescription('User have been removed from the realm.')
        .addFields(
          { name: 'User', value: `<@${targetUser.id}>`, inline: false },
          { name: 'Kicked by', value: `<@${interaction.user.id}>`, inline: false },
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
        .setDescription('❌ Terjadi kesalahan saat mem-kick user');

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
    }
  }
};


