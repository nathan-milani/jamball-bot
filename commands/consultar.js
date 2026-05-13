const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { LIMITE_SEMANAL, carregarDados, inicioSemanaAtual, obterRetirada } = require("../utils/dados");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("consultar")
    .setDescription("Consulta quantos papéis um membro já retirou na semana")
    .addUserOption(opt =>
      opt.setName("membro").setDescription("O membro a consultar").setRequired(true)
    ),

  async execute(interaction) {
    const membro = interaction.options.getUser("membro");
    const dados = carregarDados();
    const semana = inicioSemanaAtual();
    const total = obterRetirada(dados, membro.id, semana);
    const restante = LIMITE_SEMANAL - total;

    let cor, status;
    if (total === 0)                        { cor = 0x5865f2; status = "📋 Nenhuma retirada esta semana"; }
    else if (total >= LIMITE_SEMANAL)       { cor = 0xe74c3c; status = "🔴 Limite atingido"; }
    else if (total >= LIMITE_SEMANAL * 0.8) { cor = 0xf1c40f; status = "🟡 Próximo do limite"; }
    else                                    { cor = 0x2ecc71; status = "🟢 Dentro do limite"; }

    const blocosCheios = Math.round((total / LIMITE_SEMANAL) * 10);
    const barra = "█".repeat(blocosCheios) + "░".repeat(10 - blocosCheios);

    const embed = new EmbedBuilder()
      .setTitle(status)
      .setColor(cor)
      .addFields(
        { name: "👤 Membro", value: `<@${membro.id}>`, inline: true },
        { name: "📊 Total retirado", value: `${total} / ${LIMITE_SEMANAL}`, inline: true },
        { name: "📦 Disponível", value: `${restante} papéis`, inline: true },
        { name: "📈 Progresso", value: `\`${barra}\` ${total}/${LIMITE_SEMANAL}`, inline: false }
      )
      .setFooter({ text: `Semana iniciada em ${semana}` });

    return interaction.reply({ embeds: [embed] });
  },
};
