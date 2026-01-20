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
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Kamu tidak memiliki permission untuk kick member');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Check if bot can kick
      if (!guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Bot tidak memiliki permission untuk kick member');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Cannot kick yourself
      if (targetUser.id === interaction.user.id) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Kamu tidak bisa kick dirimu sendiri');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      // Cannot kick owner
      if (targetUser.id === guild.ownerId) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Kamu tidak bisa kick owner server');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
        });
      }

      const targetMember = await guild.members.fetch(targetUser.id);

      // Check role hierarchy - bot can't kick members with equal or higher roles
      if (targetMember.roles.highest.position >= guild.members.me.roles.highest.position) {
        const errorText = new TextDisplayBuilder()
          .setContent('❌ Bot tidak bisa kick member dengan role yang sama atau lebih tinggi');

        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xFF0000)
          .addTextDisplayComponents(errorText);

        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer],
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

      const successText = new TextDisplayBuilder()
        .setContent(
          `## :white_check_mark: User kicked.\n\n` +
          `Target: ${targetUser.username}\n` +
          `User ID: ${targetUser.id}\n` +
          `Reason: ${reason}\n` +
          `Moderator: ${interaction.user.username}`
        );

      const successContainer = new ContainerBuilder()
        .setAccentColor(parseInt(config.primaryColor, 16))
        .addTextDisplayComponents(successText);

      await interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [successContainer],
      });
    } catch (error) {
      console.error(error);
      const errorText = new TextDisplayBuilder()
        .setContent('❌ Terjadi kesalahan saat mem-kick user');

      const errorContainer = new ContainerBuilder()
        .setAccentColor(0xFF0000)
        .addTextDisplayComponents(errorText);

      return interaction.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [errorContainer],
      });
    }
  }
};


