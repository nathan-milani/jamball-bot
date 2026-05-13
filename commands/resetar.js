const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { carregarDados, inicioSemanaAtual, resetarMembro } = require("../utils/dados");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resetar")
    .setDescription("[ADMIN] Reseta os dados de um membro na semana atual")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt =>
      opt.setName("membro").setDescription("O membro a resetar").setRequired(true)
    ),

  async execute(interaction) {
    const membro = interaction.options.getUser("membro");
    const dados = carregarDados();
    const semana = inicioSemanaAtual();

    const resetou = resetarMembro(dados, membro.id, semana);

    if (resetou) {
      return interaction.reply({ content: `✅ Dados de <@${membro.id}> na semana atual foram resetados.`, ephemeral: true });
    } else {
      return interaction.reply({ content: `ℹ️ <@${membro.id}> não possui registros nesta semana.`, ephemeral: true });
    }
  },
};
