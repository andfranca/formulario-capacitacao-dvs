import { media, mediana, distribuicao, formatarPercentual } from "../utils/stats";
import type { AvaliacaoRecord } from "./avaliacoes";
import type { EstatisticasQuestao, EstatisticasResultados } from "../views/admin";

function estatisticasQuestao(valores: number[]): EstatisticasQuestao {
  return {
    respostas: valores.length,
    media: media(valores),
    mediana: mediana(valores),
    distribuicao: distribuicao(valores),
  };
}

const LABEL_TEMPO: Record<string, string> = {
  insuficiente: "Insuficiente",
  adequado: "Adequado",
  longo: "Longo",
};

export function calcularEstatisticasResultados(avaliacoes: AvaliacaoRecord[], q5Aplicavel: boolean): EstatisticasResultados {
  const q1 = estatisticasQuestao(avaliacoes.map((a) => a.q1));
  const q2 = estatisticasQuestao(avaliacoes.map((a) => a.q2));
  const q3 = estatisticasQuestao(avaliacoes.map((a) => a.q3));
  const q4 = estatisticasQuestao(avaliacoes.map((a) => a.q4));
  const q5 = q5Aplicavel
    ? estatisticasQuestao(avaliacoes.map((a) => a.q5).filter((v): v is number => v !== null))
    : null;

  const total = avaliacoes.length;
  const contagemTempo = new Map<string, number>([
    ["insuficiente", 0],
    ["adequado", 0],
    ["longo", 0],
  ]);
  for (const a of avaliacoes) contagemTempo.set(a.tempo, (contagemTempo.get(a.tempo) ?? 0) + 1);

  const tempo = Array.from(contagemTempo.entries()).map(([chave, quantidade]) => ({
    label: LABEL_TEMPO[chave] ?? chave,
    quantidade,
    percentual: total > 0 ? formatarPercentual(quantidade / total) : formatarPercentual(null),
  }));

  const comentarios = avaliacoes
    .filter((a) => a.comentario && a.comentario.trim() !== "")
    .map((a) => ({ nome: a.nome?.trim() || "Participante não identificado", comentario: a.comentario as string }));

  return { totalRespostas: total, q1, q2, q3, q4, q5, tempo, comentarios };
}
