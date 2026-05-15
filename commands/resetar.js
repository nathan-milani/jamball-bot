const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { carregarDados, resetarMembro, resetarTodos } = require("../utils/dados");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resetar")
    .setDescription("[ADMIN] Reseta as drogas de um membro ou de todos")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt =>
      opt.setName("membro").setDescription("O membro a resetar (deixe vazio para resetar TODOS)").setRequired(false)
    ),

  async execute(interaction) {
    const membro = interaction.options.getUser("membro");
    const dados = carregarDados();

    // ── Resetar TODOS ──
    if (!membro) {
      const contador = resetarTodos(dados);

      const embed = new EmbedBuilder()
        .setTitle("🔄 Reset geral realizado!")
        .setDescription(
          contador > 0
            ? `As retiradas de **${contador} membro(s)** foram zeradas.`
            : `Nenhum membro possuía retiradas registradas.`
        )
        .setColor(0x3498db)
        .setFooter({ text: `Executado por ${interaction.user.displayName}` });

      return interaction.reply({ embeds: [embed] });
    }

    // ── Resetar membro específico ──
    const resetou = resetarMembro(dados, membro.id);

    if (resetou) {
      return interaction.reply({ content: `✅ Dados de <@${membro.id}> foram resetados.`, ephemeral: true });
    } else {
      return interaction.reply({ content: `ℹ️ <@${membro.id}> não possui retiradas registradas.`, ephemeral: true });
    }
  },
};
