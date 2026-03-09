const { SlashCommandBuilder, PermissionFlagsBits, TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, MessageFlags, MediaGalleryBuilder, MediaGalleryItemBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SectionBuilder } = require('discord.js');
const config = require('../../config/config.json');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const paymentsFile = path.join(__dirname, '../../config/payments.json');

const getPayments = () => {
  const data = fs.readFileSync(paymentsFile, 'utf8');
  return JSON.parse(data);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('payments')
    .setDescription('View payment methods')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Select payment type')
        .setRequired(true)
        .addChoices(
          { name: 'Lokal', value: 'lokal' },
          { name: 'Internasional', value: 'internasional' }
        )
    ),

  async run(client, interaction) {
    const payments = getPayments();
    const paymentType = interaction.options.getString('type');

    // Defer the reply karena fetching image butuh waktu
    await interaction.deferReply();

    try {
      let headerTitle = '';
      let imageUrl = null;
      let briSection, gopaySection, danaSection, qrisText;
      let paypalSection, btcSection, ethSection, usdtSection, binanceSection;

      if (paymentType === 'lokal') {
        headerTitle = ' <:checkmar:1473669951306072074> **Payment Methods - Lokal**';

        // Bank BRI Section with copy button
        const briButton = new ButtonBuilder()
          .setCustomId('copy_bri')
          .setLabel('Copy')
          .setStyle(ButtonStyle.Secondary);
        briSection = new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('### <:briiii:1473666278152601621> Bank BRI'),
            new TextDisplayBuilder().setContent(`Nomor Rekening: \`${payments.lokal.bri.norek || '[NOMOR_REKENING]'}\``)
          )
          .setButtonAccessory(briButton);

        // Gopay Section with copy button
        const gopayButton = new ButtonBuilder()
          .setCustomId('copy_gopay')
          .setLabel('Copy')
          .setStyle(ButtonStyle.Secondary);
        gopaySection = new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('### <:FS_Gopay:1473665380470755408> Gopay'),
            new TextDisplayBuilder().setContent(`Nomor Rekening: \`${payments.lokal.gopay.norek || '[NOMOR_REKENING]'}\``)
          )
          .setButtonAccessory(gopayButton);

        // Dana Section with copy button
        const danaButton = new ButtonBuilder()
          .setCustomId('copy_dana')
          .setLabel('Copy')
          .setStyle(ButtonStyle.Secondary);
        danaSection = new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('### <:FS_Dana:1473665378562478196> Dana'),
            new TextDisplayBuilder().setContent(`Nomor Rekening: \`${payments.lokal.dana.norek || '[NOMOR_REKENING]'}\``)
          )
          .setButtonAccessory(danaButton);

        // QRIS Section
        qrisText = new TextDisplayBuilder()
          .setContent('### <:Qris:1473665385059455122> QRIS\nScan QR Code untuk pembayaran instant');
        imageUrl = payments.lokal.qris.imageUrl;
      } else if (paymentType === 'internasional') {
        headerTitle = ' <:checkmar:1473669951306072074> **Payment Methods - Internasional**';

        // PayPal Section with copy button
        const paypalButton = new ButtonBuilder()
          .setCustomId('copy_paypal')
          .setLabel('Copy')
          .setStyle(ButtonStyle.Secondary);
        paypalSection = new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('### <:Paypal:1411033414358012038> **PayPal F&F**'),
            new TextDisplayBuilder().setContent(`Email: \`${payments.internasional.paypal.email || 'email@example.com'}\``)
          )
          .setButtonAccessory(paypalButton);

        // BTC Section with copy button
        const btcButton = new ButtonBuilder()
          .setCustomId('copy_btc')
          .setLabel('Copy')
          .setStyle(ButtonStyle.Secondary);
        btcSection = new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('### <:bitcoin:1458675619591229582> **Bitcoin (BTC)**'),
            new TextDisplayBuilder().setContent(`Wallet: \`${payments.internasional.crypto.btc || '[WALLET_BTC]'}\``)
          )
          .setButtonAccessory(btcButton);

        // ETH Section with copy button
        const ethButton = new ButtonBuilder()
          .setCustomId('copy_eth')
          .setLabel('Copy')
          .setStyle(ButtonStyle.Secondary);
        ethSection = new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('### <:ethereum:1458675723291070621> **Ethereum (ETH)**'),
            new TextDisplayBuilder().setContent(`Wallet: \`${payments.internasional.crypto.ethereum_erc20 || '[WALLET_ETH]'}\``)
          )
          .setButtonAccessory(ethButton);

        // USDT Section with copy button
        const usdtButton = new ButtonBuilder()
          .setCustomId('copy_usdt')
          .setLabel('Copy')
          .setStyle(ButtonStyle.Secondary);
        usdtSection = new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('### <:USDT:1458675804014645332> **USDT (ERC20)**'),
            new TextDisplayBuilder().setContent(`Wallet: \`${payments.internasional.crypto.usdt_erc20 || '[WALLET_USDT]'}\``)
          )
          .setButtonAccessory(usdtButton);

        // Binance Section with copy button
        const binanceButton = new ButtonBuilder()
          .setCustomId('copy_binance')
          .setLabel('Copy')
          .setStyle(ButtonStyle.Secondary);
        binanceSection = new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('### <:Binance:1458675544840339526> **Binance**'),
            new TextDisplayBuilder().setContent(`ID: \`${payments.internasional.binance.id || '[BINANCE_ID]'}\``)
          )
          .setButtonAccessory(binanceButton);
        imageUrl = payments.internasional.binance.qrUrl;
      }

      // Build Components V2 response
      const headerText = new TextDisplayBuilder()
        .setContent(`# ${headerTitle}\n\nMetode pembayaran yang tersedia`);

      const warningText = new TextDisplayBuilder()
        .setContent(
          `## <:82470partnergray:1473667902233251840> **PENTING!**\n` +
          `Semua pembayaran a.n \`Syukron Maulana\`\n` +
          `Pembayaran yang salah **TIDAK DAPAT** dikembalikan.`
        );

      const sep = new SeparatorBuilder();
      const container = new ContainerBuilder()
        .addTextDisplayComponents(headerText)
        .addSeparatorComponents(sep)
        .addTextDisplayComponents(warningText)
        .addSeparatorComponents(sep);

      // Add payment sections based on type
      if (paymentType === 'lokal') {
        container.addSectionComponents(briSection);
        container.addSeparatorComponents(sep);
        container.addSectionComponents(gopaySection);
        container.addSeparatorComponents(sep);
        container.addSectionComponents(danaSection);
        container.addSeparatorComponents(sep);
        container.addTextDisplayComponents(qrisText);
        container.addSeparatorComponents(sep);
      } else {
        container.addSectionComponents(paypalSection);
        container.addSeparatorComponents(sep);
        container.addSectionComponents(btcSection);
        container.addSeparatorComponents(sep);
        container.addSectionComponents(ethSection);
        container.addSeparatorComponents(sep);
        container.addSectionComponents(usdtSection);
        container.addSeparatorComponents(sep);
        container.addSectionComponents(binanceSection);
        container.addSeparatorComponents(sep);
      }

      // Add image gallery if available
      if (imageUrl) {
        const mediaGallery = new MediaGalleryBuilder()
          .addItems(new MediaGalleryItemBuilder().setURL(imageUrl));
        container
          .addMediaGalleryComponents(mediaGallery)
          .addSeparatorComponents(new SeparatorBuilder());
      }

      const replyOptions = {
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      };

      await interaction.editReply(replyOptions);

      // Get the reply message for collector
      const replyMessage = await interaction.fetchReply();

      // Create collector for button interactions
      const filter = (i) =>
        i.user.id === interaction.user.id &&
        i.message.id === replyMessage.id;

      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 600000, // 10 minutes
      });

      collector.on('collect', async (buttonInteraction) => {
        const customId = buttonInteraction.customId;
        let copyText = '';
        let label = '';

        switch (customId) {
          case 'copy_bri':
            copyText = payments.lokal.bri.norek;
            label = 'Bank BRI';
            break;
          case 'copy_gopay':
            copyText = payments.lokal.gopay.norek;
            label = 'Gopay';
            break;
          case 'copy_dana':
            copyText = payments.lokal.dana.norek;
            label = 'Dana';
            break;
          case 'copy_paypal':
            copyText = payments.internasional.paypal.email;
            label = 'PayPal';
            break;
          case 'copy_btc':
            copyText = payments.internasional.crypto.btc;
            label = 'Bitcoin (BTC)';
            break;
          case 'copy_eth':
            copyText = payments.internasional.crypto.ethereum_erc20;
            label = 'Ethereum (ETH)';
            break;
          case 'copy_usdt':
            copyText = payments.internasional.crypto.usdt_erc20;
            label = 'USDT (ERC20)';
            break;
          case 'copy_binance':
            copyText = payments.internasional.binance.id;
            label = 'Binance ID';
            break;
          default:
            return;
        }

        await buttonInteraction.reply({
          content: `📋 ${label}\n\`\`\`${copyText}\`\`\``,
          ephemeral: true,
        });
      });

      collector.on('end', () => {
        // Collector expired, no action needed
      });
    } catch (error) {
      console.error('Error in payments command:', error);
      const errorText = new TextDisplayBuilder()
        .setContent('❌ Terjadi kesalahan saat mengambil data pembayaran');

      const errorContainer = new ContainerBuilder()
        .setAccentColor(0xFF0000)
        .addTextDisplayComponents(errorText);

      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [errorContainer]
      });
    }
  }
};
