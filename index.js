require("dotenv").config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const {
  LIMITE_SEMANAL,
  carregarDados,
  obterRetirada,
  registrarRetirada,
} = require("./utils/dados");

const CANAL_DROGAS = "drogas";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  }
}

client.once("ready", () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  console.log(`📢 Monitorando canal: #${CANAL_DROGAS}`);
});

// ─── LISTENER DA SALA DROGAS ─────────────────────────────────────
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.channel.name.toLowerCase().includes(CANAL_DROGAS.toLowerCase())) return;
  if (message.mentions.users.size === 0) return;

  const match = message.content.match(/\d+/);
  if (!match) return;

  const quantidade = parseInt(match[0]);
  if (isNaN(quantidade) || quantidade <= 0) return;

  const membroMencionado = message.mentions.users.first();
  const membroId = membroMencionado.id;

  const dados = carregarDados();
  const atual = obterRetirada(dados, membroId);
  const novoTotal = atual + quantidade;

  if (atual >= LIMITE_SEMANAL) {
    const embed = new EmbedBuilder()
      .setTitle("🚫 Limite já atingido!")
      .setDescription(
        `<@${membroId}> já retirou **${atual} drogas** e atingiu o limite máximo de **${LIMITE_SEMANAL} drogas**.\n\nNenhuma retirada foi registrada.`
      )
      .setColor(0xe74c3c)
      .setFooter({ text: `Anotado por ${message.author.displayName}` });
    return message.reply({ embeds: [embed] });
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
      .setColor(0xe67e22)
      .setFooter({ text: `Anotado por ${message.author.displayName}` });
    return message.reply({ embeds: [embed] });
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
    .setFooter({ text: `Anotado por ${message.author.displayName}` });

  if (totalFinal === LIMITE_SEMANAL) {
    embed.addFields({ name: "⚠️ Aviso", value: `<@${membroId}> **atingiu o limite máximo**!`, inline: false });
  }

  return message.reply({ embeds: [embed] });
});

// ─── COMANDOS SLASH ───────────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const msg = { content: "❌ Ocorreu um erro ao executar o comando.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

client.login(process.env.TOKEN);
