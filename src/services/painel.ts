import { formatarPercentual, taxaResposta } from "../utils/stats";
import { nomeArea } from "../data/areas";
import type { IndicadoresPainel } from "../views/admin";

export interface FiltrosPainel {
  area?: string;
  tipo?: string;
  periodoInicio?: string;
  periodoFim?: string;
}

function condicoesFiltro(filtros: FiltrosPainel): { where: string; params: unknown[] } {
  const condicoes: string[] = [];
  const params: unknown[] = [];
  if (filtros.area) {
    condicoes.push("c.area = ?");
    params.push(filtros.area);
  }
  if (filtros.tipo) {
    condicoes.push("c.tipo = ?");
    params.push(filtros.tipo);
  }
  if (filtros.periodoInicio) {
    condicoes.push("c.data_inicio >= ?");
    params.push(filtros.periodoInicio);
  }
  if (filtros.periodoFim) {
    condicoes.push("c.data_inicio <= ?");
    params.push(filtros.periodoFim);
  }
  return { where: condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "", params };
}

export async function calcularIndicadoresPainel(db: D1Database, filtros: FiltrosPainel): Promise<IndicadoresPainel> {
  const { where, params } = condicoesFiltro(filtros);

  const base = await db
    .prepare(
      `SELECT
        c.id, c.codigo, c.titulo, c.area, c.numero_participantes,
        COUNT(a.id) AS respostas
       FROM capacitacoes c
       LEFT JOIN avaliacoes a ON a.capacitacao_id = c.id
       ${where}
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
    )
    .bind(...params)
    .all<{ id: number; codigo: string; titulo: string; area: string; numero_participantes: number | null; respostas: number }>();

  const linhas = base.results;

  const totalCapacitacoes = linhas.length;
  const capacitacoesComResposta = linhas.filter((l) => l.respostas > 0).length;
  const totalRespostas = linhas.reduce((soma, l) => soma + l.respostas, 0);

  const comParticipantesInformados = linhas.filter((l) => l.numero_participantes !== null);
  const totalParticipantes = comParticipantesInformados.reduce((soma, l) => soma + (l.numero_participantes ?? 0), 0);
  const respostasConsideradas = comParticipantesInformados.reduce((soma, l) => soma + l.respostas, 0);
  const taxaGeral = formatarPercentual(taxaResposta(respostasConsideradas, totalParticipantes || null));

  const porAreaMap = new Map<string, { respostas: number; participantes: number }>();
  for (const l of linhas) {
    const atual = porAreaMap.get(l.area) ?? { respostas: 0, participantes: 0 };
    atual.respostas += l.respostas;
    if (l.numero_participantes !== null) atual.participantes += l.numero_participantes;
    porAreaMap.set(l.area, atual);
  }
  const porArea = Array.from(porAreaMap.entries()).map(([area, v]) => ({
    area: nomeArea(area),
    respostas: v.respostas,
    participantes: v.participantes,
    taxa: formatarPercentual(taxaResposta(v.respostas, v.participantes || null)),
  }));

  const porCapacitacao = linhas.map((l) => ({
    codigo: l.codigo,
    titulo: l.titulo,
    taxa: formatarPercentual(taxaResposta(l.respostas, l.numero_participantes)),
  }));

  const evolucaoResult = await db
    .prepare(
      `SELECT strftime('%Y-%m', a.created_at) AS periodo, COUNT(*) AS respostas
       FROM avaliacoes a
       JOIN capacitacoes c ON c.id = a.capacitacao_id
       ${where}
       GROUP BY periodo
       ORDER BY periodo ASC`,
    )
    .bind(...params)
    .all<{ periodo: string; respostas: number }>();

  return {
    totalCapacitacoes,
    capacitacoesComResposta,
    totalParticipantes,
    totalRespostas,
    taxaGeral,
    porArea,
    porCapacitacao,
    evolucao: evolucaoResult.results,
  };
}
