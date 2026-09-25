import { gerarCsv } from "../utils/csv";
import { nomeArea } from "../data/areas";
import { labelTipo } from "../data/tipos";

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

const COLUNAS_AVALIACOES = [
  "id",
  "capacitacao_id",
  "nome",
  "email",
  "tipo_servidor",
  "municipio",
  "crs",
  "formacao",
  "curso",
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "tempo",
  "comentario",
  "created_at",
];

export async function exportarAvaliacoesCsv(db: D1Database): Promise<string> {
  const { results } = await db.prepare(`SELECT * FROM avaliacoes ORDER BY created_at`).all<Record<string, unknown>>();
  return gerarCsv(COLUNAS_AVALIACOES, results);
}

const COLUNAS_CONSOLIDADO = [
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
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "tempo",
  "comentario",
  "respondido_em",
];

export async function exportarConsolidadoCsv(db: D1Database): Promise<string> {
  const { results } = await db
    .prepare(
      `SELECT
        c.codigo, c.titulo, c.area, c.tipo, c.data_inicio, c.data_fim,
        a.id AS avaliacao_id, a.nome, a.email, a.tipo_servidor, a.municipio, a.crs,
        a.formacao, a.curso, a.q1, a.q2, a.q3, a.q4, a.q5, a.tempo, a.comentario,
        a.created_at AS respondido_em
       FROM avaliacoes a
       JOIN capacitacoes c ON c.id = a.capacitacao_id
       ORDER BY a.created_at`,
    )
    .all<Record<string, unknown>>();
  const linhas = results.map((r) => ({
    ...r,
    area: nomeArea(String(r.area)),
    tipo: labelTipo(String(r.tipo)),
  }));
  return gerarCsv(COLUNAS_CONSOLIDADO, linhas);
}
