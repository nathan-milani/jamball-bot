const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { carregarDados, salvarDados, inicioSemanaAtual, resetarMembro } = require("../utils/dados");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resetar")
    .setDescription("[ADMIN] Reseta as drogas de um membro ou de todos na semana atual")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt =>
      opt.setName("membro").setDescription("O membro a resetar (deixe vazio para resetar TODOS)").setRequired(false)
    ),

  async execute(interaction) {
    const membro = interaction.options.getUser("membro");
    const dados = carregarDados();
    const semana = inicioSemanaAtual();

    // ── Resetar TODOS ──
    if (!membro) {
      let contador = 0;
      for (const membroId of Object.keys(dados)) {
        if (dados[membroId][semana] !== undefined) {
          delete dados[membroId][semana];
          contador++;
        }
      }
      salvarDados(dados);

      const embed = new EmbedBuilder()
        .setTitle("🔄 Reset geral realizado!")
        .setDescription(
          contador > 0
            ? `As retiradas de **${contador} membro(s)** foram zeradas para a semana atual.`
            : `Nenhum membro possuía retiradas registradas nesta semana.`
        )
        .setColor(0x3498db)
        .setFooter({ text: `Semana ${semana} • Executado por ${interaction.user.displayName}` });

      return interaction.reply({ embeds: [embed] });
    }

    // ── Resetar membro específico ──
    const resetou = resetarMembro(dados, membro.id, semana);

    if (resetou) {
      return interaction.reply({ content: `✅ Dados de <@${membro.id}> na semana atual foram resetados.`, ephemeral: true });
    } else {
      return interaction.reply({ content: `ℹ️ <@${membro.id}> não possui registros nesta semana.`, ephemeral: true });
    }
  },
};
