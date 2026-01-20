const { MessageFlags, TextDisplayBuilder, ContainerBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/config.json');

async function handleStatusInteractions(client, interaction) {
    try {
        // Handle status toggle button
        if (interaction.customId === 'status_toggle_btn') {
            return await handleStatusToggle(client, interaction);
        }
    } catch (error) {
        console.error('[STATUS INTERACTION ERROR]', error);
        await replyWithError(interaction, error.message);
    }
}

async function handleStatusToggle(client, interaction) {
    try {
        // Check if user has admin/staff role
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && !interaction.member.roles.cache.has(config.roles.staff)) {
            const errorBlock = new ContainerBuilder()
                .setAccentColor(0xFF0000)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('❌ Only admins or staff can toggle store status!')
                );
            return await interaction.reply({
                content: '',
                components: [errorBlock],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            });
        }

        const fs = require('fs');
        const path = require('path');
        const statusFile = path.join(__dirname, '../../config/status.json');

        const getStatus = () => {
            const data = fs.readFileSync(statusFile, 'utf8');
            return JSON.parse(data);
        };

        const setStatus = (isOpen, updatedBy) => {
            const status = {
                isOpen,
                lastUpdated: new Date().toISOString(),
                updatedBy
            };
            fs.writeFileSync(statusFile, JSON.stringify(status, null, 2), 'utf8');
            return status;
        };

        const currentStatus = getStatus();
        const newStatus = !currentStatus.isOpen;
        setStatus(newStatus, interaction.user.tag);
        console.log(`[STATUS] Status changed to ${newStatus ? 'OPEN' : 'CLOSED'}`);

        // Update voice channel name
        try {
            const statusChannel = await interaction.client.channels.fetch(config.channels.statusVoice);
            if (statusChannel && statusChannel.isVoiceBased()) {
                const statusEmoji = newStatus ? '🟢' : '🔴';
                const statusText = newStatus ? 'OPEN' : 'CLOSED';
                await statusChannel.setName(`STATUS: ${statusEmoji} [${statusText}]`);
                console.log(`[STATUS] Voice channel updated: STATUS: ${statusEmoji} [${statusText}]`);
            }
        } catch (err) {
            console.error(`[STATUS] Failed to update voice channel: ${err.message}`);
        }

        const title = newStatus ? `WE ARE OPEN` : `🔒 We're Closed for Today!`;
        const description = newStatus 
            ? `Yang mau nanya-nanya dulu, atau yang udah siap gas order, pintu selalu terbuka. Jangan ragu buat apa admin di tiket ya. Gas bikin tiket sekarang, mumpung antrean masih aman! 🔥`
            : `Ticket system bakal kami lock setelah ini! buat yang sudah buka ticket akan tetap direspon sampai trx/kendala kamu selesai`;
        
        const content = `# ${title}

<@&${config.roles.member}>

${description}`;

        await interaction.update({
            content: content,
        }).catch(err => {
            console.error('[STATUS UPDATE ERROR]', err.message);
        });

        console.log(`[STATUS] Store status toggled to ${newStatus ? 'OPEN' : 'CLOSED'} by ${interaction.user.tag}`);
    } catch (error) {
        console.error('[STATUS TOGGLE ERROR]', error);
        await replyWithError(interaction, error.message);
    }
}

function replyWithError(interaction, message, isEditReply = false) {
    const errorBlock = new ContainerBuilder()
        .setAccentColor(parseInt(config.primaryColor, 16))
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`❌ ${message}`)
        );

    const replyOptions = {
        components: [errorBlock],
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    };

    if (isEditReply) {
        return interaction.editReply(replyOptions);
    } else {
        return interaction.reply(replyOptions);
    }
}

module.exports = { handleStatusInteractions };
