const { MessageFlags, TextDisplayBuilder, ContainerBuilder, EmbedBuilder, ActionRowBuilder, UserSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const config = require('../../config/config.json');
const fs = require('fs');
const path = require('path');

const paymentsFile = path.join(__dirname, '../../config/payments.json');

const getPayments = () => {
  const data = fs.readFileSync(paymentsFile, 'utf8');
  return JSON.parse(data);
};

// Command categories for help
const commandCategories = {
  info: {
    label: 'ℹ️ Info',
    description: 'Information and utility commands',
    commands: ['afk', 'help', 'membercount', 'ping', 'serverinfo', 'stats', 'whois']
  },
  moderation: {
    label: '🛡️ Moderation',
    description: 'Moderation and management commands',
    commands: ['ban', 'clearwarns', 'deafen', 'delwarn', 'kick', 'lock', 'mute', 'nick', 'purge', 'role', 'softban', 'unban', 'undeafen', 'unlock', 'unmute', 'warn', 'warnlogs']
  },
  payment: {
    label: '💳 Payment',
    description: 'Payment and testimonial commands',
    commands: ['payments', 'status', 'testimonial']
  },
  tickets: {
    label: '🎫 Tickets',
    description: 'Ticket management commands',
    commands: ['add', 'blacklist', 'close']
  },
  general: {
    label: '⭐ General',
    description: 'General purpose commands',
    commands: ['review']
  }
};

async function handleSelectMenus(client, interaction) {
    try {
        if (interaction.customId === 'help_category_select') {
            const selectedCategory = interaction.values[0];
            const category = commandCategories[selectedCategory];
            const accentColor = parseInt(config.primaryColor.replace('#', ''), 16);

            if (!category) {
                return await interaction.update({
                    content: '❌ Category not found!',
                    components: []
                });
            }

            // Get command details from client
            const commandDetails = category.commands
                .map(cmdName => {
                    const cmd = client.slash.get(cmdName);
                    return cmd ? `**/${cmdName}** - ${cmd.data.description || 'No description'}` : null;
                })
                .filter(cmd => cmd)
                .join('\n');

            const categoryText = new TextDisplayBuilder()
                .setContent(`# ${category.label}\n\n${commandDetails || 'No commands found'}`);

            // Create new select menu
            const selectOptions = Object.entries(commandCategories).map(([key, cat]) => 
                new StringSelectMenuOptionBuilder()
                    .setLabel(cat.label)
                    .setValue(key)
                    .setDescription(cat.description)
                    .setDefault(key === selectedCategory)
            );

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help_category_select')
                .setPlaceholder('Select a category')
                .addOptions(selectOptions);

            const selectRow = new ActionRowBuilder().addComponents(selectMenu);
            
            const sep = new SeparatorBuilder();
            const container = new ContainerBuilder()
                .setAccentColor(accentColor)
                .addTextDisplayComponents(categoryText);

            await interaction.update({
                components: [container, selectRow],
                flags: MessageFlags.IsComponentsV2,
            });
            return;
        }

        if (interaction.customId === 'middleman_range_select') {
            // Handle middleman range selection - show step 2 with range details
            const rangeValue = interaction.values[0];
            
            const rangeMap = {
                '1': 'Rp 10.000 - Rp 50.000',
                '2': 'Rp 50.001 - Rp 100.000',
                '3': 'Rp 100.001 - Rp 300.000',
                '4': 'Rp 300.001 - Rp 500.000',
                '5': 'Rp 500.001 - Rp 1.000.000',
                '6': '> Rp 1.000.000'
            };

            const feeMap = {
                '1': 'Rp 2.000',
                '2': 'Rp 5.000',
                '3': 'Rp 10.000',
                '4': 'Rp 15.000',
                '5': 'Rp 25.000',
                '6': '2% flat'
            };

            const userSelect = new UserSelectMenuBuilder()
                .setCustomId(`middleman_user_select_${rangeValue}`)
                .setPlaceholder('Pilih pembeli atau penjual')
                .setMaxValues(1);

            const title = new TextDisplayBuilder()
                .setContent(`# HAJI UTONG - Middleman`);
            
            const separator1 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large);
            
            const detailsText = new TextDisplayBuilder()
                .setContent(`• **Range Transaksi Dipilih:** ${rangeMap[rangeValue]}\n• **Fee Rekber:** ${feeMap[rangeValue]}`);
            
            const separator2 = new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large);
            
            const description = new TextDisplayBuilder()
                .setContent(`Sekarang pilih pembeli atau penjual yang akan ditambahkan ke ticket:`);

            const selectRow = new ActionRowBuilder().addComponents(userSelect);

            const container = new ContainerBuilder()
                .setAccentColor(parseInt(config.primaryColor, 16))
                .addTextDisplayComponents(title)
                .addSeparatorComponents(separator1)
                .addTextDisplayComponents(detailsText)
                .addSeparatorComponents(separator2)
                .addTextDisplayComponents(description)
                .addActionRowComponents(selectRow);

            await interaction.update({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });
            return;
        }
    } catch (err) {
        console.error('[SELECT MENU ERROR]', err.message);
        // Silently fail if interaction is expired
    }
}

module.exports = { handleSelectMenus };
