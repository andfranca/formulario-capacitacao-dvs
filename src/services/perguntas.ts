export type TipoPergunta = "escala_1_10" | "sim_nao" | "multipla_escolha" | "texto_livre";

export interface OpcaoPergunta {
  id: number;
  texto: string;
  ordem: number;
}

export interface Pergunta {
  id: number;
  texto: string;
  tipo: TipoPergunta;
  obrigatoria: boolean;
  somenteComInstrutor: boolean;
  ativa: boolean;
  ordem: number;
  opcoes: OpcaoPergunta[];
}

interface PerguntaRow {
  id: number;
  texto: string;
  tipo: TipoPergunta;
  obrigatoria: number;
  somente_com_instrutor: number;
  ativa: number;
  ordem: number;
}

interface OpcaoRow {
  id: number;
  pergunta_id: number;
  texto: string;
  ordem: number;
}

function montarPerguntas(perguntaRows: PerguntaRow[], opcaoRows: OpcaoRow[]): Pergunta[] {
  return perguntaRows.map((p) => ({
    id: p.id,
    texto: p.texto,
    tipo: p.tipo,
    obrigatoria: p.obrigatoria === 1,
    somenteComInstrutor: p.somente_com_instrutor === 1,
    ativa: p.ativa === 1,
    ordem: p.ordem,
    opcoes: opcaoRows
      .filter((o) => o.pergunta_id === p.id)
      .sort((a, b) => a.ordem - b.ordem)
      .map((o) => ({ id: o.id, texto: o.texto, ordem: o.ordem })),
  }));
}

export async function listarPerguntas(db: D1Database, opcoes: { apenasAtivas?: boolean } = {}): Promise<Pergunta[]> {
  const where = opcoes.apenasAtivas ? "WHERE ativa = 1" : "";
  const [{ results: perguntaRows }, { results: opcaoRows }] = await Promise.all([
    db.prepare(`SELECT * FROM perguntas ${where} ORDER BY ordem ASC`).all<PerguntaRow>(),
    db.prepare(`SELECT * FROM pergunta_opcoes ORDER BY ordem ASC`).all<OpcaoRow>(),
  ]);
  return montarPerguntas(perguntaRows, opcaoRows);
}

export async function buscarPerguntaPorId(db: D1Database, id: number): Promise<Pergunta | null> {
  const [pergunta, { results: opcaoRows }] = await Promise.all([
    db.prepare(`SELECT * FROM perguntas WHERE id = ?`).bind(id).first<PerguntaRow>(),
    db.prepare(`SELECT * FROM pergunta_opcoes WHERE pergunta_id = ? ORDER BY ordem ASC`).bind(id).all<OpcaoRow>(),
  ]);
  if (!pergunta) return null;
  return montarPerguntas([pergunta], opcaoRows)[0];
}

// Perguntas que se aplicam a uma capacitação específica: ativas, e a
// exceção "somente com instrutor" respeitada conforme o tipo da capacitação
// (decidido sempre pelo backend, nunca por dado enviado pelo participante).
export function perguntasAplicaveis(todas: Pergunta[], temInstrutor: boolean): Pergunta[] {
  return todas.filter((p) => p.ativa && (!p.somenteComInstrutor || temInstrutor));
}

// Para a tela de resultados de uma capacitação específica: perguntas atualmente
// aplicáveis + qualquer pergunta já desativada que ainda tenha respostas
// registradas para essa capacitação (o histórico nunca some da tela).
export function perguntasParaResultados(todas: Pergunta[], temInstrutor: boolean, idsComResposta: Set<number>): Pergunta[] {
  const aplicaveis = perguntasAplicaveis(todas, temInstrutor);
  const idsJaIncluidos = new Set(aplicaveis.map((p) => p.id));
  const extras = todas.filter((p) => idsComResposta.has(p.id) && !idsJaIncluidos.has(p.id));
  return [...aplicaveis, ...extras].sort((a, b) => a.ordem - b.ordem);
}

export interface NovaPerguntaInput {
  texto: string;
  tipo: TipoPergunta;
  obrigatoria: boolean;
  somenteComInstrutor: boolean;
  opcoes: string[];
}

export async function criarPergunta(db: D1Database, input: NovaPerguntaInput): Promise<Pergunta> {
  const nowIso = new Date().toISOString();
  const { results: maxRows } = await db.prepare(`SELECT COALESCE(MAX(ordem), 0) AS maximo FROM perguntas`).all<{ maximo: number }>();
  const proximaOrdem = (maxRows[0]?.maximo ?? 0) + 1;

  const row = await db
    .prepare(
      `INSERT INTO perguntas (texto, tipo, obrigatoria, somente_com_instrutor, ativa, ordem, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?)
       RETURNING *`,
    )
    .bind(input.texto, input.tipo, input.obrigatoria ? 1 : 0, input.somenteComInstrutor ? 1 : 0, proximaOrdem, nowIso, nowIso)
    .first<PerguntaRow>();
  if (!row) throw new Error("Falha ao criar pergunta.");

  if (input.tipo === "multipla_escolha" && input.opcoes.length > 0) {
    await db.batch(
      input.opcoes.map((texto, indice) =>
        db.prepare(`INSERT INTO pergunta_opcoes (pergunta_id, texto, ordem) VALUES (?, ?, ?)`).bind(row.id, texto, indice + 1),
      ),
    );
  }

  return (await buscarPerguntaPorId(db, row.id))!;
}

export interface EdicaoPerguntaInput {
  texto: string;
  obrigatoria: boolean;
  somenteComInstrutor: boolean;
}

export async function atualizarPergunta(db: D1Database, id: number, input: EdicaoPerguntaInput): Promise<Pergunta | null> {
  const nowIso = new Date().toISOString();
  const row = await db
    .prepare(
      `UPDATE perguntas SET texto = ?, obrigatoria = ?, somente_com_instrutor = ?, updated_at = ?
       WHERE id = ?
       RETURNING *`,
    )
    .bind(input.texto, input.obrigatoria ? 1 : 0, input.somenteComInstrutor ? 1 : 0, nowIso, id)
    .first<PerguntaRow>();
  if (!row) return null;
  return buscarPerguntaPorId(db, id);
}

export async function alternarAtivaPergunta(db: D1Database, id: number, ativa: boolean): Promise<void> {
  const nowIso = new Date().toISOString();
  await db.prepare(`UPDATE perguntas SET ativa = ?, updated_at = ? WHERE id = ?`).bind(ativa ? 1 : 0, nowIso, id).run();
}
