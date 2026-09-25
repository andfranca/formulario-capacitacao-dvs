import type { NovaAvaliacaoInput } from "../utils/validation";

export interface AvaliacaoRecord {
  id: number;
  capacitacao_id: number;
  nome: string | null;
  email: string | null;
  tipo_servidor: "municipal" | "estadual";
  municipio: string | null;
  crs: string | null;
  formacao: "ensino_medio" | "tecnico" | "superior";
  curso: string | null;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number | null;
  tempo: "insuficiente" | "adequado" | "longo";
  comentario: string | null;
  created_at: string;
}

export async function criarAvaliacao(
  db: D1Database,
  capacitacaoId: number,
  input: NovaAvaliacaoInput,
): Promise<AvaliacaoRecord> {
  const nowIso = new Date().toISOString();
  const row = await db
    .prepare(
      `INSERT INTO avaliacoes
        (capacitacao_id, nome, email, tipo_servidor, municipio, crs, formacao, curso,
         q1, q2, q3, q4, q5, tempo, comentario, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .bind(
      capacitacaoId,
      input.nome,
      input.email,
      input.tipo_servidor,
      input.municipio,
      input.crs,
      input.formacao,
      input.curso,
      input.q1,
      input.q2,
      input.q3,
      input.q4,
      input.q5,
      input.tempo,
      input.comentario,
      nowIso,
    )
    .first<AvaliacaoRecord>();
  if (!row) throw new Error("Falha ao registrar avaliação.");
  return row;
}

export async function contarRespostas(db: D1Database, capacitacaoId: number): Promise<number> {
  const row = await db
    .prepare(`SELECT COUNT(*) AS total FROM avaliacoes WHERE capacitacao_id = ?`)
    .bind(capacitacaoId)
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export async function listarAvaliacoesPorCapacitacao(db: D1Database, capacitacaoId: number): Promise<AvaliacaoRecord[]> {
  const { results } = await db
    .prepare(`SELECT * FROM avaliacoes WHERE capacitacao_id = ? ORDER BY created_at ASC`)
    .bind(capacitacaoId)
    .all<AvaliacaoRecord>();
  return results;
}
