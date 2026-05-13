const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {
  LIMITE_SEMANAL,
  carregarDados,
  inicioSemanaAtual,
  obterRetirada,
  registrarRetirada,
} = require("../utils/dados");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("retirar")
    .setDescription("Registra a retirada de papéis de um membro")
    .addUserOption(opt =>
      opt.setName("membro").setDescription("O membro que está retirando").setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("quantidade").setDescription("Quantidade de papéis").setRequired(true).setMinValue(1)
    ),

  async execute(interaction) {
    const membro = interaction.options.getUser("membro");
    const quantidade = interaction.options.getInteger("quantidade");
    const dados = carregarDados();
    const semana = inicioSemanaAtual();
    const membroId = membro.id;
    const atual = obterRetirada(dados, membroId, semana);
    const novoTotal = atual + quantidade;

    // Já no limite
    if (atual >= LIMITE_SEMANAL) {
      const embed = new EmbedBuilder()
        .setTitle("🚫 Limite já atingido!")
        .setDescription(
          `<@${membroId}> já retirou **${atual} papéis** esta semana e atingiu o limite máximo de **${LIMITE_SEMANAL} papéis**.\n\nNenhuma retirada foi registrada.`
        )
        .setColor(0xe74c3c)
        .setFooter({ text: `Semana iniciada em ${semana}` });

      return interaction.reply({ embeds: [embed] });
    }

    // Ultrapassaria o limite
    if (novoTotal > LIMITE_SEMANAL) {
      const disponivel = LIMITE_SEMANAL - atual;
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Limite semanal excedido!")
        .setDescription(
          `<@${membroId}> já retirou **${atual} papéis** esta semana.\n` +
          `Você tentou registrar mais **${quantidade}**, mas o limite é **${LIMITE_SEMANAL}**.\n\n` +
          `📦 Máximo disponível ainda: **${disponivel} papéis**.\n\n` +
          `Nenhuma retirada foi registrada. Ajuste a quantidade e tente novamente.`
        )
        .setColor(0xe67e22)
        .setFooter({ text: `Semana iniciada em ${semana}` });

      return interaction.reply({ embeds: [embed] });
    }

    // Retirada válida
    const totalFinal = registrarRetirada(dados, membroId, semana, quantidade);
    const restante = LIMITE_SEMANAL - totalFinal;

    let cor, status;
    if (totalFinal === LIMITE_SEMANAL) {
      cor = 0xe74c3c; status = "🔴 Limite atingido!";
    } else if (totalFinal >= LIMITE_SEMANAL * 0.8) {
      cor = 0xf1c40f; status = "🟡 Atenção: próximo do limite";
    } else {
      cor = 0x2ecc71; status = "🟢 Retirada registrada";
    }

    const blocosCheios = Math.round((totalFinal / LIMITE_SEMANAL) * 10);
    const barra = "█".repeat(blocosCheios) + "░".repeat(10 - blocosCheios);

    const embed = new EmbedBuilder()
      .setTitle(status)
      .setColor(cor)
      .addFields(
        { name: "👤 Membro", value: `<@${membroId}>`, inline: true },
        { name: "📄 Retirado agora", value: `${quantidade} papéis`, inline: true },
        { name: "📊 Total na semana", value: `${totalFinal} / ${LIMITE_SEMANAL}`, inline: true },
        { name: "📦 Disponível", value: `${restante} papéis`, inline: true },
        { name: "📈 Progresso", value: `\`${barra}\` ${totalFinal}/${LIMITE_SEMANAL}`, inline: false }
      )
      .setFooter({ text: `Semana ${semana} • Registrado por ${interaction.user.displayName}` });

    if (totalFinal === LIMITE_SEMANAL) {
      embed.addFields({ name: "⚠️ Aviso", value: `<@${membroId}> **atingiu o limite máximo** desta semana!`, inline: false });
    }

    return interaction.reply({ embeds: [embed] });
  },
};
