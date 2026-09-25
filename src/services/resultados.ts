import { media, mediana, distribuicao, formatarPercentual } from "../utils/stats";
import type { Pergunta } from "./perguntas";

export interface RespostaBruta {
  pergunta_id: number;
  valor: string;
  nome: string | null;
}

interface OpcaoResultado {
  label: string;
  quantidade: number;
  percentual: string;
}

export type ResultadoPergunta =
  | { pergunta: Pergunta; tipo: "escala_1_10"; totalRespostas: number; media: number | null; mediana: number | null; distribuicao: { nota: number; quantidade: number }[] }
  | { pergunta: Pergunta; tipo: "sim_nao" | "multipla_escolha"; totalRespostas: number; opcoes: OpcaoResultado[] }
  | { pergunta: Pergunta; tipo: "texto_livre"; totalRespostas: number; textos: { nome: string; texto: string }[] };

function calcularPercentual(quantidade: number, total: number): string {
  return formatarPercentual(total > 0 ? quantidade / total : null);
}

// Lógica pura (sem D1) para facilitar testes: recebe as perguntas já aplicáveis
// à capacitação e todas as respostas brutas (join respostas + avaliacoes.nome).
export function calcularResultadosPerguntas(perguntasAplicaveis: Pergunta[], respostas: RespostaBruta[]): ResultadoPergunta[] {
  const porPergunta = new Map<number, RespostaBruta[]>();
  for (const r of respostas) {
    if (!porPergunta.has(r.pergunta_id)) porPergunta.set(r.pergunta_id, []);
    porPergunta.get(r.pergunta_id)!.push(r);
  }

  return perguntasAplicaveis.map((pergunta): ResultadoPergunta => {
    const doPergunta = porPergunta.get(pergunta.id) ?? [];

    if (pergunta.tipo === "escala_1_10") {
      const valores = doPergunta.map((r) => Number(r.valor));
      return {
        pergunta,
        tipo: "escala_1_10",
        totalRespostas: valores.length,
        media: media(valores),
        mediana: mediana(valores),
        distribuicao: distribuicao(valores),
      };
    }

    if (pergunta.tipo === "sim_nao") {
      const total = doPergunta.length;
      const simCount = doPergunta.filter((r) => r.valor === "sim").length;
      return {
        pergunta,
        tipo: "sim_nao",
        totalRespostas: total,
        opcoes: [
          { label: "Sim", quantidade: simCount, percentual: calcularPercentual(simCount, total) },
          { label: "Não", quantidade: total - simCount, percentual: calcularPercentual(total - simCount, total) },
        ],
      };
    }

    if (pergunta.tipo === "multipla_escolha") {
      const total = doPergunta.length;
      const contagem = new Map<number, number>();
      for (const o of pergunta.opcoes) contagem.set(o.id, 0);
      for (const r of doPergunta) {
        const id = Number(r.valor);
        contagem.set(id, (contagem.get(id) ?? 0) + 1);
      }
      return {
        pergunta,
        tipo: "multipla_escolha",
        totalRespostas: total,
        opcoes: pergunta.opcoes.map((o) => ({
          label: o.texto,
          quantidade: contagem.get(o.id) ?? 0,
          percentual: calcularPercentual(contagem.get(o.id) ?? 0, total),
        })),
      };
    }

    return {
      pergunta,
      tipo: "texto_livre",
      totalRespostas: doPergunta.length,
      textos: doPergunta.map((r) => ({ nome: r.nome?.trim() || "Participante não identificado", texto: r.valor })),
    };
  });
}
