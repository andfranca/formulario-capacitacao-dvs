import { gerarCsv } from "../utils/csv";
import { nomeArea } from "../data/areas";
import { labelTipo } from "../data/tipos";
import { listarPerguntas, type Pergunta } from "./perguntas";

const COLUNAS_CAPACITACOES = [
  "codigo",
  "titulo",
  "area",
  "tipo",
  "instrutor",
  "data_inicio",
  "data_fim",
  "numero_participantes",
  "status",
  "created_at",
];

export async function exportarCapacitacoesCsv(db: D1Database): Promise<string> {
  const { results } = await db.prepare(`SELECT * FROM capacitacoes ORDER BY created_at`).all<Record<string, unknown>>();
  const linhas = results.map((r) => ({
    ...r,
    area: nomeArea(String(r.area)),
    tipo: labelTipo(String(r.tipo)),
  }));
  return gerarCsv(COLUNAS_CAPACITACOES, linhas);
}

const COLUNAS_BASE_AVALIACOES = ["id", "capacitacao_id", "nome", "email", "tipo_servidor", "municipio", "crs", "formacao", "curso", "created_at"];

function formatarValorResposta(pergunta: Pergunta, valorBruto: string | undefined): string {
  if (valorBruto === undefined) return "";
  if (pergunta.tipo === "multipla_escolha") {
    const opcao = pergunta.opcoes.find((o) => String(o.id) === valorBruto);
    return opcao?.texto ?? valorBruto;
  }
  if (pergunta.tipo === "sim_nao") return valorBruto === "sim" ? "Sim" : "Não";
  return valorBruto;
}

// Carrega o template de perguntas (todas, incluindo desativadas, para não
// perder colunas de respostas históricas) e uma matriz avaliacao_id -> pergunta_id -> valor.
async function carregarMatrizRespostas(db: D1Database): Promise<{ perguntas: Pergunta[]; porAvaliacao: Map<number, Map<number, string>> }> {
  const [perguntas, { results }] = await Promise.all([
    listarPerguntas(db),
    db.prepare(`SELECT avaliacao_id, pergunta_id, valor FROM respostas`).all<{ avaliacao_id: number; pergunta_id: number; valor: string }>(),
  ]);

  const porAvaliacao = new Map<number, Map<number, string>>();
  for (const r of results) {
    if (!porAvaliacao.has(r.avaliacao_id)) porAvaliacao.set(r.avaliacao_id, new Map());
    porAvaliacao.get(r.avaliacao_id)!.set(r.pergunta_id, r.valor);
  }
  return { perguntas, porAvaliacao };
}

function montarLinhaRespostas(perguntas: Pergunta[], respostasDaAvaliacao: Map<number, string> | undefined): Record<string, string> {
  const linha: Record<string, string> = {};
  for (const p of perguntas) {
    linha[p.texto] = formatarValorResposta(p, respostasDaAvaliacao?.get(p.id));
  }
  return linha;
}

export async function exportarAvaliacoesCsv(db: D1Database): Promise<string> {
  const [{ results: avaliacoes }, { perguntas, porAvaliacao }] = await Promise.all([
    db.prepare(`SELECT * FROM avaliacoes ORDER BY created_at`).all<Record<string, unknown>>(),
    carregarMatrizRespostas(db),
  ]);

  const colunas = [...COLUNAS_BASE_AVALIACOES, ...perguntas.map((p) => p.texto)];
  const linhas = avaliacoes.map((a) => ({
    ...a,
    ...montarLinhaRespostas(perguntas, porAvaliacao.get(a.id as number)),
  }));
  return gerarCsv(colunas, linhas);
}

const COLUNAS_BASE_CONSOLIDADO = [
  "codigo",
  "titulo",
  "area",
  "tipo",
  "data_inicio",
  "data_fim",
  "avaliacao_id",
  "nome",
  "email",
  "tipo_servidor",
  "municipio",
  "crs",
  "formacao",
  "curso",
  "respondido_em",
];

export async function exportarConsolidadoCsv(db: D1Database): Promise<string> {
  const [{ results }, { perguntas, porAvaliacao }] = await Promise.all([
    db
      .prepare(
        `SELECT
          c.codigo, c.titulo, c.area, c.tipo, c.data_inicio, c.data_fim,
          a.id AS avaliacao_id, a.nome, a.email, a.tipo_servidor, a.municipio, a.crs,
          a.formacao, a.curso, a.created_at AS respondido_em
         FROM avaliacoes a
         JOIN capacitacoes c ON c.id = a.capacitacao_id
         ORDER BY a.created_at`,
      )
      .all<Record<string, unknown>>(),
    carregarMatrizRespostas(db),
  ]);

  const colunas = [...COLUNAS_BASE_CONSOLIDADO, ...perguntas.map((p) => p.texto)];
  const linhas = results.map((r) => ({
    ...r,
    area: nomeArea(String(r.area)),
    tipo: labelTipo(String(r.tipo)),
    ...montarLinhaRespostas(perguntas, porAvaliacao.get(r.avaliacao_id as number)),
  }));
  return gerarCsv(colunas, linhas);
}
