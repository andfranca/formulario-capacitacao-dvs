import { gerarHashSenha, verificarSenha } from "./senha";

export interface CriadorRecord {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  senha_salt: string;
  senha_iteracoes: number;
  created_at: string;
}

export interface CriadorComContagem {
  id: number;
  nome: string;
  email: string;
  created_at: string;
  capacitacoes_criadas: number;
}

export async function criarCriador(db: D1Database, nome: string, email: string, senha: string): Promise<CriadorRecord> {
  const { hash, salt, iteracoes } = await gerarHashSenha(senha);
  const nowIso = new Date().toISOString();
  const row = await db
    .prepare(
      `INSERT INTO usuarios (nome, email, senha_hash, senha_salt, senha_iteracoes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .bind(nome, email, hash, salt, iteracoes, nowIso)
    .first<CriadorRecord>();
  if (!row) throw new Error("Falha ao criar conta de Criador de Curso.");
  return row;
}

export async function autenticarCriador(db: D1Database, email: string, senha: string): Promise<CriadorRecord | null> {
  const row = await db.prepare(`SELECT * FROM usuarios WHERE email = ?`).bind(email).first<CriadorRecord>();
  if (!row) return null;
  const senhaOk = await verificarSenha(senha, { hash: row.senha_hash, salt: row.senha_salt, iteracoes: row.senha_iteracoes });
  return senhaOk ? row : null;
}

export async function buscarCriadorPorId(db: D1Database, id: number): Promise<CriadorRecord | null> {
  const row = await db.prepare(`SELECT * FROM usuarios WHERE id = ?`).bind(id).first<CriadorRecord>();
  return row ?? null;
}

export async function listarCriadores(db: D1Database): Promise<CriadorComContagem[]> {
  const { results } = await db
    .prepare(
      `SELECT u.id, u.nome, u.email, u.created_at, COUNT(c.id) AS capacitacoes_criadas
       FROM usuarios u
       LEFT JOIN capacitacoes c ON c.criado_por = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
    )
    .all<CriadorComContagem>();
  return results;
}

export async function excluirCriador(db: D1Database, id: number): Promise<void> {
  await db.batch([
    db.prepare(`UPDATE capacitacoes SET criado_por = NULL WHERE criado_por = ?`).bind(id),
    db.prepare(`DELETE FROM usuarios WHERE id = ?`).bind(id),
  ]);
}
