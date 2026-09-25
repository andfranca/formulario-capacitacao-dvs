import type { ParticipanteInput, RespostaInput } from "../utils/validation";

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
  created_at: string;
}

export async function criarAvaliacao(
  db: D1Database,
  capacitacaoId: number,
  participante: ParticipanteInput,
  respostas: RespostaInput[],
): Promise<AvaliacaoRecord> {
  const nowIso = new Date().toISOString();
  const avaliacao = await db
    .prepare(
      `INSERT INTO avaliacoes
        (capacitacao_id, nome, email, tipo_servidor, municipio, crs, formacao, curso, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .bind(
      capacitacaoId,
      participante.nome,
      participante.email,
      participante.tipo_servidor,
      participante.municipio,
      participante.crs,
      participante.formacao,
      participante.curso,
      nowIso,
    )
    .first<AvaliacaoRecord>();
  if (!avaliacao) throw new Error("Falha ao registrar avaliação.");

  if (respostas.length > 0) {
    await db.batch(
      respostas.map((r) =>
        db.prepare(`INSERT INTO respostas (avaliacao_id, pergunta_id, valor) VALUES (?, ?, ?)`).bind(avaliacao.id, r.perguntaId, r.valor),
      ),
    );
  }

  return avaliacao;
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

export async function buscarRespostasPorCapacitacao(
  db: D1Database,
  capacitacaoId: number,
): Promise<{ pergunta_id: number; valor: string; nome: string | null }[]> {
  const { results } = await db
    .prepare(
      `SELECT r.pergunta_id, r.valor, a.nome
       FROM respostas r
       JOIN avaliacoes a ON a.id = r.avaliacao_id
       WHERE a.capacitacao_id = ?`,
    )
    .bind(capacitacaoId)
    .all<{ pergunta_id: number; valor: string; nome: string | null }>();
  return results;
}
