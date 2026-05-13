require("dotenv").config();
const { REST, Routes } = require("discord.js");
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const fs = require("fs");
const path = require("path");

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
    console.log(`[DEPLOY] Queued: /${command.data.name}`);
  }
}

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(`[DEPLOY] Deploying ${commands.length} command(s) → Guild ${guildId} (instant)`);

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log(`[DEPLOY] ${data.length} command(s) registered:`);
    data.forEach(cmd => console.log(`  • /${cmd.name}`));
  } catch (error) {
    console.error("[DEPLOY ERROR]", error);
  }
})();
