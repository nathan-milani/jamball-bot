const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { LIMITE_SEMANAL, carregarDados, inicioSemanaAtual } = require("../utils/dados");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ranking")
    .setDescription("Mostra o ranking de retiradas da semana atual"),

  async execute(interaction) {
    const dados = carregarDados();
    const semana = inicioSemanaAtual();

    const membrosSemana = Object.entries(dados)
      .map(([uid, semanas]) => ({ uid, total: semanas[semana] ?? 0 }))
      .filter(m => m.total > 0)
      .sort((a, b) => b.total - a.total);

    if (membrosSemana.length === 0) {
      return interaction.reply({ content: "📋 Nenhuma retirada registrada esta semana ainda.", ephemeral: true });
    }

    const medalhas = ["🥇", "🥈", "🥉"];
    const linhas = membrosSemana.map(({ uid, total }, i) => {
      const medalha = medalhas[i] ?? `\`${i + 1}.\``;
      const limite = total >= LIMITE_SEMANAL ? " 🔴" : "";
      return `${medalha} <@${uid}> — ${total}/${LIMITE_SEMANAL} drogas${limite}`;
    });

    const embed = new EmbedBuilder()
      .setTitle("🏆 Ranking da Semana")
      .setDescription(linhas.join("\n"))
      .setColor(0xf1c40f)
      .setFooter({ text: `Semana iniciada em ${semana}` });

    return interaction.reply({ embeds: [embed] });
  },
};
