export interface Area {
  sigla: string;
  nome: string;
}

// Lista fechada de áreas responsáveis. A "sigla" é o valor armazenado em
// capacitacoes.area e também compõe o código da capacitação (SIGLA-DDMMAA).
export const AREAS: Area[] = [
  { sigla: "DVS", nome: "Divisão de Vigilância Sanitária (DVS)" },
  { sigla: "GGQ", nome: "Grupo de Gestão da Qualidade (GGQ)" },
  { sigla: "ALI", nome: "Setor de Alimentos (ALI)" },
  { sigla: "CS", nome: "Setor de Cosméticos e Saneantes (CS)" },
  { sigla: "EST", nome: "Setor de Estabelecimentos de Saúde (EST)" },
  { sigla: "GRES", nome: "Setor de Gerenciamento de Risco em Estabelecimentos de Saúde (GRES)" },
  { sigla: "MED", nome: "Setor de Medicamentos (MED)" },
  { sigla: "PPS", nome: "Setor de Produtos para Saúde (PPS)" },
  { sigla: "RAD", nome: "Setor de Radiações (RAD)" },
  { sigla: "STC", nome: "Setor de Sangue, Tecidos e Células (STC)" },
];

export function isAreaValida(sigla: string): boolean {
  return AREAS.some((a) => a.sigla === sigla);
}

export function nomeArea(sigla: string): string {
  return AREAS.find((a) => a.sigla === sigla)?.nome ?? sigla;
}
