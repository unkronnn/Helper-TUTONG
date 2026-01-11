const { SlashCommandBuilder, PermissionFlagsBits, TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, MessageFlags, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
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
    .setDescription('Tampilkan metode pembayaran')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Pilih jenis pembayaran')
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
      let responseText = '';
      let headerTitle = '';
      let imageUrl = null;

      if (paymentType === 'lokal') {
        headerTitle = '💳 **Payment Methods - Lokal**';
        responseText = `### <:BankJago:1423319788062642206> Bank Jago\n`;
        responseText += `Nomor Rekening: \`${payments.lokal.jago.norek || '[NOMOR_REKENING]'}\`\n\n`;

        responseText += `### <:Seabank:1423319869767553167> Seabank\n`;
        responseText += `Nomor Rekening: \`${payments.lokal.seabank.norek || '[NOMOR_REKENING]'}\`\n\n`;

        responseText += `### <:BCA:1459742597999362226> BCA\n`;
        responseText += `Nomor Rekening: \`${payments.lokal.bca.norek || '[NOMOR_REKENING]'}\`\n\n`;

        responseText += `### <:QRIS:1411033023914447011> QRIS\n`;
        responseText += `Scan QR Code untuk pembayaran instant`;
        imageUrl = payments.lokal.qris.imageUrl;
      } else if (paymentType === 'internasional') {
        headerTitle = '💳 **Payment Methods - Internasional**';
        responseText = `### <:Paypal:1411033414358012038> **PayPal F&F**\n`;
        responseText += `Email: \`${payments.internasional.paypal.email || 'email@example.com'}\`\n\n`;

        responseText += `### <:bitcoin:1458675619591229582> **Bitcoin (BTC)**\n`;
        responseText += `Wallet: \`${payments.internasional.crypto.btc || '[WALLET_BTC]'}\`\n\n`;

        responseText += `### <:ethereum:1458675723291070621> **Ethereum (ETH)**\n`;
        responseText += `Wallet: \`${payments.internasional.crypto.ethereum_erc20 || '[WALLET_ETH]'}\`\n\n`;

        responseText += `### <:USDT:1458675804014645332> **USDT (ERC20)**\n`;
        responseText += `Wallet: \`${payments.internasional.crypto.usdt_erc20 || '[WALLET_USDT]'}\`\n\n`;

        responseText += `### <:Binance:1458675544840339526> **Binance**\n`;
        responseText += `ID: \`${payments.internasional.binance.id || '[BINANCE_ID]'}\``;
        imageUrl = payments.internasional.binance.qrUrl;
      }

      // Build Components V2 response
      const headerText = new TextDisplayBuilder()
        .setContent(`# ${headerTitle}\n\nMetode pembayaran yang tersedia`);

      const warningText = new TextDisplayBuilder()
        .setContent(
          `## ⚠️ **PENTING!**\n` +
          `Semua pembayaran a.n \`Naufal Alif Prasetya\`\n` +
          `Pembayaran yang salah **TIDAK DAPAT** dikembalikan.`
        );

      const detailsText = new TextDisplayBuilder()
        .setContent(responseText);

      const sep = new SeparatorBuilder();
      const container = new ContainerBuilder()
        .setAccentColor(parseInt(config.color.replace('#', ''), 16))
        .addTextDisplayComponents(headerText)
        .addSeparatorComponents(sep)
        .addTextDisplayComponents(warningText)
        .addSeparatorComponents(sep)
        .addTextDisplayComponents(detailsText)
        .addSeparatorComponents(sep);

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
