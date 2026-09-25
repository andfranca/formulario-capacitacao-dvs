import type { NovaCapacitacaoInput, EdicaoCapacitacaoInput } from "../utils/validation";
import { tipoTemInstrutor } from "../data/tipos";
import { gerarCodigoCandidato, isUniqueConstraintError } from "./codigo";

export interface CapacitacaoRecord {
  id: number;
  codigo: string;
  titulo: string;
  area: string;
  tipo: string;
  instrutor: string | null;
  data_inicio: string;
  data_fim: string;
  numero_participantes: number | null;
  status: "ativa" | "encerrada";
  created_at: string;
  updated_at: string;
}

const MAX_TENTATIVAS_CODIGO = 1000;

export async function criarCapacitacao(db: D1Database, input: NovaCapacitacaoInput): Promise<CapacitacaoRecord> {
  const agora = new Date();
  const nowIso = agora.toISOString();
  const instrutor = tipoTemInstrutor(input.tipo) ? input.instrutor : null;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_CODIGO; tentativa++) {
    const codigo = gerarCodigoCandidato(input.area, agora, tentativa);
    try {
      const row = await db
        .prepare(
          `INSERT INTO capacitacoes
            (codigo, titulo, area, tipo, instrutor, data_inicio, data_fim, numero_participantes, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ativa', ?, ?)
           RETURNING *`,
        )
        .bind(
          codigo,
          input.titulo,
          input.area,
          input.tipo,
          instrutor,
          input.data_inicio,
          input.data_fim,
          input.numero_participantes,
          nowIso,
          nowIso,
        )
        .first<CapacitacaoRecord>();
      if (!row) throw new Error("Falha ao criar capacitação.");
      return row;
    } catch (err) {
      if (isUniqueConstraintError(err)) continue;
      throw err;
    }
  }
  throw new Error("Não foi possível gerar um código único para a capacitação.");
}

export async function buscarCapacitacaoPorCodigo(db: D1Database, codigo: string): Promise<CapacitacaoRecord | null> {
  const row = await db.prepare(`SELECT * FROM capacitacoes WHERE codigo = ?`).bind(codigo).first<CapacitacaoRecord>();
  return row ?? null;
}

export async function buscarCapacitacaoPorId(db: D1Database, id: number): Promise<CapacitacaoRecord | null> {
  const row = await db.prepare(`SELECT * FROM capacitacoes WHERE id = ?`).bind(id).first<CapacitacaoRecord>();
  return row ?? null;
}

export interface CapacitacaoComContagem extends CapacitacaoRecord {
  respostas: number;
}

export async function listarCapacitacoes(db: D1Database): Promise<CapacitacaoComContagem[]> {
  const { results } = await db
    .prepare(
      `SELECT c.*, COUNT(a.id) AS respostas
       FROM capacitacoes c
       LEFT JOIN avaliacoes a ON a.capacitacao_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
    )
    .all<CapacitacaoComContagem>();
  return results;
}

export async function atualizarCapacitacao(
  db: D1Database,
  id: number,
  input: EdicaoCapacitacaoInput,
): Promise<CapacitacaoRecord | null> {
  const instrutor = tipoTemInstrutor(input.tipo) ? input.instrutor : null;
  const nowIso = new Date().toISOString();
  const row = await db
    .prepare(
      `UPDATE capacitacoes
       SET titulo = ?, tipo = ?, instrutor = ?, data_inicio = ?, data_fim = ?,
           numero_participantes = ?, status = ?, updated_at = ?
       WHERE id = ?
       RETURNING *`,
    )
    .bind(
      input.titulo,
      input.tipo,
      instrutor,
      input.data_inicio,
      input.data_fim,
      input.numero_participantes,
      input.status,
      nowIso,
      id,
    )
    .first<CapacitacaoRecord>();
  return row ?? null;
}

export async function alternarStatusCapacitacao(
  db: D1Database,
  id: number,
  novoStatus: "ativa" | "encerrada",
): Promise<CapacitacaoRecord | null> {
  const nowIso = new Date().toISOString();
  const row = await db
    .prepare(`UPDATE capacitacoes SET status = ?, updated_at = ? WHERE id = ? RETURNING *`)
    .bind(novoStatus, nowIso, id)
    .first<CapacitacaoRecord>();
  return row ?? null;
}
