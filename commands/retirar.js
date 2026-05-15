const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {
  LIMITE_SEMANAL,
  carregarDados,
  obterRetirada,
  registrarRetirada,
} = require("../utils/dados");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("retirar")
    .setDescription("Registra a retirada de drogas de um membro")
    .addUserOption(opt =>
      opt.setName("membro").setDescription("O membro que está retirando").setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("quantidade").setDescription("Quantidade de drogas").setRequired(true).setMinValue(1)
    ),

  async execute(interaction) {
    const membro = interaction.options.getUser("membro");
    const quantidade = interaction.options.getInteger("quantidade");
    const dados = carregarDados();
    const membroId = membro.id;
    const atual = obterRetirada(dados, membroId);
    const novoTotal = atual + quantidade;

    if (atual >= LIMITE_SEMANAL) {
      const embed = new EmbedBuilder()
        .setTitle("🚫 Limite já atingido!")
        .setDescription(
          `<@${membroId}> já retirou **${atual} drogas** e atingiu o limite máximo de **${LIMITE_SEMANAL} drogas**.\n\nNenhuma retirada foi registrada.`
        )
        .setColor(0xe74c3c);
      return interaction.reply({ embeds: [embed] });
    }

    if (novoTotal > LIMITE_SEMANAL) {
      const disponivel = LIMITE_SEMANAL - atual;
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Limite excedido!")
        .setDescription(
          `<@${membroId}> já retirou **${atual} drogas**.\n` +
          `Você tentou registrar mais **${quantidade}**, mas o limite é **${LIMITE_SEMANAL}**.\n\n` +
          `📦 Máximo disponível ainda: **${disponivel} drogas**.\n\n` +
          `Nenhuma retirada foi registrada. Ajuste a quantidade e tente novamente.`
        )
        .setColor(0xe67e22);
      return interaction.reply({ embeds: [embed] });
    }

    const totalFinal = registrarRetirada(dados, membroId, quantidade);
    const restante = LIMITE_SEMANAL - totalFinal;

    let cor, status;
    if (totalFinal === LIMITE_SEMANAL)            { cor = 0xe74c3c; status = "🔴 Limite atingido!"; }
    else if (totalFinal >= LIMITE_SEMANAL * 0.8)  { cor = 0xf1c40f; status = "🟡 Atenção: próximo do limite"; }
    else                                           { cor = 0x2ecc71; status = "🟢 Retirada registrada"; }

    const blocosCheios = Math.round((totalFinal / LIMITE_SEMANAL) * 10);
    const barra = "█".repeat(blocosCheios) + "░".repeat(10 - blocosCheios);

    const embed = new EmbedBuilder()
      .setTitle(status)
      .setColor(cor)
      .addFields(
        { name: "👤 Membro", value: `<@${membroId}>`, inline: true },
        { name: "💊 Retirado agora", value: `${quantidade} drogas`, inline: true },
        { name: "📊 Total", value: `${totalFinal} / ${LIMITE_SEMANAL}`, inline: true },
        { name: "📦 Disponível", value: `${restante} drogas`, inline: true },
        { name: "📈 Progresso", value: `\`${barra}\` ${totalFinal}/${LIMITE_SEMANAL}`, inline: false }
      )
      .setFooter({ text: `Registrado por ${interaction.user.displayName}` });

    if (totalFinal === LIMITE_SEMANAL) {
      embed.addFields({ name: "⚠️ Aviso", value: `<@${membroId}> **atingiu o limite máximo**!`, inline: false });
    }

    return interaction.reply({ embeds: [embed] });
  },
};
