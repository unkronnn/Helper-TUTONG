const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { TextDisplayBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');
const { Warning } = require('../../database/mongodb');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to warn')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for warning (optional')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

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
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Kamu tidak memiliki permission untuk warn member');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      // Cannot warn yourself
      if (targetUser.id === interaction.user.id) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Kamu tidak bisa warn dirimu sendiri');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      // Cannot warn owner
      if (targetUser.id === guild.ownerId) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setDescription('❌ Kamu tidak bisa warn owner server');

        return interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true
        });
      }

      // Load warnings and add new warning
      const userId = targetUser.id;
      const guildId = guild.id;

      let warningDoc = await Warning.findOne({ userId, guildId });

      if (!warningDoc) {
        warningDoc = new Warning({
          userId,
          guildId,
          username: targetUser.username,
          warnings: []
        });
      }

      warningDoc.warnings.push({
        reason: reason,
        moderator: interaction.user.username,
        timestamp: new Date()
      });

      await warningDoc.save();

      const warningCount = warningDoc.warnings.length;

      // Send DM to user
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor(0xFF9900)
          .setTitle('Warned')
          .setDescription(`You have been warned in **${guild.name}**.`)
          .addFields(
            { name: 'Reason', value: reason || 'No reason provided', inline: false },
            { name: 'Warning Count', value: `${warningCount}`, inline: false }
          )
          .setFooter({ text: `Moderator: ${interaction.user.username}` })
          .setTimestamp();

        await targetUser.send({ embeds: [dmEmbed] });
      } catch (dmError) {
        logger.info(`Could not DM ${targetUser.username}`);
      }

      const successEmbed = new EmbedBuilder()
        .setColor(0xFF9900)
        .setTitle('User Warned')
        .setDescription('Successfully warned the user!')
        .addFields(
          { name: 'User', value: `<@${targetUser.id}>`, inline: false },
          { name: 'Warn by', value: `<@${interaction.user.id}>`, inline: false },
          { name: 'Reason', value: reason || 'No reason provided', inline: false },
          { name: 'Warning Count', value: `${warningCount}`, inline: false }
        );

      await interaction.reply({
        embeds: [successEmbed],
        ephemeral: true
      });
    } catch (error) {
      console.error(error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setDescription('❌ Terjadi kesalahan saat mem-warn user');

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true
      });
    }
  }
};


