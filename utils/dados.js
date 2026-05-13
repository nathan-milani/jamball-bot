const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "dados_papeis.json");
const LIMITE_SEMANAL = 400;

function carregarDados() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  }
  return {};
}

function salvarDados(dados) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2), "utf-8");
}

function inicioSemanaAtual() {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0=dom, 1=seg...
  const diff = (diaSemana === 0 ? -6 : 1) - diaSemana; // ajusta para segunda-feira
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() + diff);
  return segunda.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function obterRetirada(dados, membroId, semana) {
  return dados?.[membroId]?.[semana] ?? 0;
}

function registrarRetirada(dados, membroId, semana, quantidade) {
  if (!dados[membroId]) dados[membroId] = {};
  const atual = dados[membroId][semana] ?? 0;
  dados[membroId][semana] = atual + quantidade;
  salvarDados(dados);
  return dados[membroId][semana];
}

function resetarMembro(dados, membroId, semana) {
  if (dados?.[membroId]?.[semana] !== undefined) {
    delete dados[membroId][semana];
    salvarDados(dados);
    return true;
  }
  return false;
}

module.exports = {
  LIMITE_SEMANAL,
  carregarDados,
  salvarDados,
  inicioSemanaAtual,
  obterRetirada,
  registrarRetirada,
  resetarMembro,
};
