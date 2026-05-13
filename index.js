require("dotenv").config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const {
  LIMITE_SEMANAL,
  carregarDados,
  inicioSemanaAtual,
  obterRetirada,
  registrarRetirada,
} = require("./utils/dados");

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────
// Nome da sala onde as anotações serão feitas (pode ser parcial, sem #)
const CANAL_DROGAS = "drogas";

// ─────────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Carrega todos os comandos da pasta /commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  }
}

// ─── EVENTO: BOT PRONTO ──────────────────────────────────────────
client.once("ready", () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  console.log(`📢 Monitorando canal: #${CANAL_DROGAS}`);
});

// ─── EVENTO: MENSAGEM NA SALA DROGAS ─────────────────────────────
// Formato esperado: @membro <quantidade>
// Exemplo: "@João 50" ou "@João 50 drogas"
client.on("messageCreate", async (message) => {
  // Ignora bots e mensagens fora do canal correto
  if (message.author.bot) return;
  if (!message.channel.name.toLowerCase().includes(CANAL_DROGAS.toLowerCase())) return;

  // Precisa ter pelo menos uma menção de usuário
  if (message.mentions.users.size === 0) return;

  // Extrai o número da mensagem (primeiro número encontrado)
  const match = message.content.match(/\d+/);
  if (!match) return;

  const quantidade = parseInt(match[0]);
  if (isNaN(quantidade) || quantidade <= 0) return;

  // Pega o primeiro membro mencionado
  const membroMencionado = message.mentions.users.first();
  const membroId = membroMencionado.id;

  const dados = carregarDados();
  const semana = inicioSemanaAtual();
  const atual = obterRetirada(dados, membroId, semana);
  const novoTotal = atual + quantidade;

  // Já no limite
  if (atual >= LIMITE_SEMANAL) {
    const embed = new EmbedBuilder()
      .setTitle("🚫 Limite já atingido!")
      .setDescription(
        `<@${membroId}> já retirou **${atual} drogas** esta semana e atingiu o limite máximo de **${LIMITE_SEMANAL} drogas**.\n\nNenhuma retirada foi registrada.`
      )
      .setColor(0xe74c3c)
      .setFooter({ text: `Semana iniciada em ${semana} • Anotado por ${message.author.displayName}` });

    return message.reply({ embeds: [embed] });
  }

  // Ultrapassaria o limite
  if (novoTotal > LIMITE_SEMANAL) {
    const disponivel = LIMITE_SEMANAL - atual;
    const embed = new EmbedBuilder()
      .setTitle("⚠️ Limite semanal excedido!")
      .setDescription(
        `<@${membroId}> já retirou **${atual} drogas** esta semana.\n` +
        `Você tentou registrar mais **${quantidade}**, mas o limite é **${LIMITE_SEMANAL}**.\n\n` +
        `📦 Máximo disponível ainda: **${disponivel} drogas**.\n\n` +
        `Nenhuma retirada foi registrada. Ajuste a quantidade e tente novamente.`
      )
      .setColor(0xe67e22)
      .setFooter({ text: `Semana iniciada em ${semana} • Anotado por ${message.author.displayName}` });

    return message.reply({ embeds: [embed] });
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
      { name: "💊 Retirado agora", value: `${quantidade} drogas`, inline: true },
      { name: "📊 Total na semana", value: `${totalFinal} / ${LIMITE_SEMANAL}`, inline: true },
      { name: "📦 Disponível", value: `${restante} drogas`, inline: true },
      { name: "📈 Progresso", value: `\`${barra}\` ${totalFinal}/${LIMITE_SEMANAL}`, inline: false }
    )
    .setFooter({ text: `Semana ${semana} • Anotado por ${message.author.displayName}` });

  if (totalFinal === LIMITE_SEMANAL) {
    embed.addFields({ name: "⚠️ Aviso", value: `<@${membroId}> **atingiu o limite máximo** desta semana!`, inline: false });
  }

  return message.reply({ embeds: [embed] });
});

// ─── EVENTO: COMANDO SLASH ───────────────────────────────────────
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
