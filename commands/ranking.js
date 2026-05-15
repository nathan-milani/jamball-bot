const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { LIMITE_SEMANAL, carregarDados, obterRetirada } = require("../utils/dados");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ranking")
    .setDescription("Mostra o ranking de retiradas do período atual"),

  async execute(interaction) {
    const dados = carregarDados();

    const membros = Object.entries(dados)
      .map(([uid]) => ({ uid, total: obterRetirada(dados, uid) }))
      .filter(m => m.total > 0)
      .sort((a, b) => b.total - a.total);

    if (membros.length === 0) {
      return interaction.reply({ content: "📋 Nenhuma retirada registrada ainda.", ephemeral: true });
    }

    const medalhas = ["🥇", "🥈", "🥉"];
    const linhas = membros.map(({ uid, total }, i) => {
      const medalha = medalhas[i] ?? `\`${i + 1}.\``;
      const limite = total >= LIMITE_SEMANAL ? " 🔴" : "";
      return `${medalha} <@${uid}> — ${total}/${LIMITE_SEMANAL} drogas${limite}`;
    });

    const embed = new EmbedBuilder()
      .setTitle("🏆 Ranking do Período Atual")
      .setDescription(linhas.join("\n"))
      .setColor(0xf1c40f);

    return interaction.reply({ embeds: [embed] });
  },
};
