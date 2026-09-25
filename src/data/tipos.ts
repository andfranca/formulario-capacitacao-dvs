export interface TipoCapacitacao {
  codigo: string;
  label: string;
  temInstrutor: boolean;
}

// Lista fechada de tipos de capacitação. "temInstrutor" define, no backend,
// se o campo instrutor/tutor e a pergunta Q5 se aplicam (regra da seção 11/18
// da especificação: nunca decidida por dado enviado pelo participante).
export const TIPOS_CAPACITACAO: TipoCapacitacao[] = [
  { codigo: "autoinstrucional_sem_tutor", label: "Teórica autoinstrucional - sem tutor", temInstrutor: false },
  { codigo: "autoinstrucional_com_tutor", label: "Teórica autoinstrucional - com tutor", temInstrutor: true },
  { codigo: "expositiva_online", label: "Teórica expositiva on-line (síncrona)", temInstrutor: true },
  { codigo: "expositiva_presencial", label: "Teórica expositiva presencial", temInstrutor: true },
  { codigo: "teorico_pratica", label: "Capacitação teórico-prática", temInstrutor: true },
  { codigo: "pratica", label: "Capacitação prática", temInstrutor: true },
];

export function isTipoValido(codigo: string): boolean {
  return TIPOS_CAPACITACAO.some((t) => t.codigo === codigo);
}

export function tipoTemInstrutor(codigo: string): boolean {
  return TIPOS_CAPACITACAO.find((t) => t.codigo === codigo)?.temInstrutor ?? true;
}

export function labelTipo(codigo: string): string {
  return TIPOS_CAPACITACAO.find((t) => t.codigo === codigo)?.label ?? codigo;
}
