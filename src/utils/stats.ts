export function media(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((soma, v) => soma + v, 0) / valores.length;
}

export function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  if (ordenados.length % 2 === 0) {
    return (ordenados[meio - 1] + ordenados[meio]) / 2;
  }
  return ordenados[meio];
}

// Distribuição de notas 1-10: retorna a contagem de respostas para cada nota.
export function distribuicao(valores: number[]): { nota: number; quantidade: number }[] {
  const contagem = new Map<number, number>();
  for (let nota = 1; nota <= 10; nota++) contagem.set(nota, 0);
  for (const v of valores) contagem.set(v, (contagem.get(v) ?? 0) + 1);
  return Array.from(contagem.entries()).map(([nota, quantidade]) => ({ nota, quantidade }));
}

// Taxa de resposta como fração (0-1), ou null quando não há participantes informados
// ou o total é zero (evita divisão por zero).
export function taxaResposta(respostas: number, participantes: number | null): number | null {
  if (participantes === null || participantes <= 0) return null;
  return respostas / participantes;
}

// Formata uma fração (0-1) como percentual no padrão pt-BR, ex.: "58,3%".
export function formatarPercentual(fracao: number | null): string {
  if (fracao === null) return "Não disponível";
  return `${(fracao * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function formatarNumero(valor: number | null, casasDecimais = 1): string {
  if (valor === null) return "-";
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: casasDecimais, maximumFractionDigits: casasDecimais });
}
