const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nick')
        .setDescription('Change member nickname')
        .addUserOption(option =>
            option
                .setName('member')
                .setDescription('Member to change nickname for')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('nickname')
                .setDescription('New nickname (leave empty to reset)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

    async run(client, interaction) {
        const targetMember = interaction.options.getMember('member');
        const newNickname = interaction.options.getString('nickname') || null;

        try {
            // Check if bot can manage member
            if (!targetMember.manageable) {
                return await interaction.reply({
                    content: '❌ Bot tidak dapat mengubah nickname member ini!',
                    ephemeral: true
                });
            }

            // Check role hierarchy
            const botMember = interaction.guild.members.me;
            if (targetMember.roles.highest.position >= botMember.roles.highest.position) {
                return await interaction.reply({
                    content: '❌ Tidak bisa mengubah nickname member dengan role yang sama atau lebih tinggi dari bot!',
                    ephemeral: true
                });
            }

            // Set nickname
            await targetMember.setNickname(newNickname);

            // Create Components V2 response
            const headerText = new TextDisplayBuilder()
                .setContent(`# ✅ **Nickname Changed**\n\nNickname ${targetMember.user.username} berhasil diubah`);

            const thumbnail = new ThumbnailBuilder({ media: { url: targetMember.user.displayAvatarURL({ dynamic: true }) } });
            const headerSection = new SectionBuilder()
                .addTextDisplayComponents(headerText)
                .setThumbnailAccessory(thumbnail);

            const detailsText = new TextDisplayBuilder()
                .setContent(
                    `**Member:** ${targetMember.user.username}\n` +
                    `**Nickname Baru:** ${newNickname || 'Reset (original username)'}\n` +
                    `**Changed by:** ${interaction.user.username}`
                );

            const sep = new SeparatorBuilder();
            const container = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor.replace('#', ''), 16))
                .addSeparatorComponents(sep)
                .addSectionComponents(headerSection)
                .addSeparatorComponents(sep)
                .addTextDisplayComponents(detailsText)
                .addSeparatorComponents(sep);

            await interaction.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [container],
            });

            // DM notification
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(`#${config.primaryColor}`)
                    .setTitle('📝 Nickname Changed')
                    .setDescription(`Nickname kamu di ${interaction.guild.name} telah diubah`)
                    .addFields(
                        {
                            name: 'Nickname Baru',
                            value: newNickname || 'Reset (original username)',
                            inline: false
                        }
                    )
                    .setFooter({ text: 'Diubah oleh: ' + interaction.user.username })
                    .setTimestamp();

                await targetMember.user.send({ embeds: [dmEmbed] });
            } catch (err) {
                // Ignore DM error
            }
        } catch (error) {
            console.error('Error in nick command:', error);
            await interaction.reply({
                content: `❌ Error: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
