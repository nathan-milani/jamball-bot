const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "dados_drogas.json");
const LIMITE_SEMANAL = 400;
const CHAVE = "atual"; // Chave fixa — só reseta via /resetar

function carregarDados() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  }
  return {};
}

function salvarDados(dados) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2), "utf-8");
}

function obterRetirada(dados, membroId) {
  return dados?.[membroId]?.[CHAVE] ?? 0;
}

function registrarRetirada(dados, membroId, quantidade) {
  if (!dados[membroId]) dados[membroId] = {};
  const atual = dados[membroId][CHAVE] ?? 0;
  dados[membroId][CHAVE] = atual + quantidade;
  salvarDados(dados);
  return dados[membroId][CHAVE];
}

function resetarMembro(dados, membroId) {
  if (dados?.[membroId]?.[CHAVE] !== undefined) {
    delete dados[membroId][CHAVE];
    salvarDados(dados);
    return true;
  }
  return false;
}

function resetarTodos(dados) {
  let contador = 0;
  for (const membroId of Object.keys(dados)) {
    if (dados[membroId][CHAVE] !== undefined) {
      delete dados[membroId][CHAVE];
      contador++;
    }
  }
  salvarDados(dados);
  return contador;
}

module.exports = {
  LIMITE_SEMANAL,
  CHAVE,
  carregarDados,
  salvarDados,
  obterRetirada,
  registrarRetirada,
  resetarMembro,
  resetarTodos,
};
