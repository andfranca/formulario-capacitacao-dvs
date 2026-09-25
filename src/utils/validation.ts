import { isAreaValida } from "../data/areas";
import { isTipoValido, tipoTemInstrutor } from "../data/tipos";
import { isCrsValido } from "../data/crs";
import { isMunicipioValido } from "../data/municipios-rs";

export type ValidationResult<T> = { valid: true; data: T } | { valid: false; errors: string[] };

export const LIMITES = {
  titulo: 200,
  instrutor: 150,
  nome: 150,
  email: 254,
  curso: 200,
  comentario: 2000,
} as const;

function isDataValida(valor: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(Date.parse(valor));
}

function isEmailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

export interface NovaCapacitacaoInput {
  titulo: string;
  area: string;
  tipo: string;
  instrutor: string | null;
  data_inicio: string;
  data_fim: string;
  numero_participantes: number | null;
}

interface CamposComuns {
  titulo: string;
  tipo: string;
  instrutor: string | null;
  data_inicio: string;
  data_fim: string;
  numero_participantes: number | null;
}

function validarCamposComuns(body: Record<string, unknown>, errors: string[]): CamposComuns {
  const titulo = String(body.titulo ?? "").trim();
  if (!titulo) errors.push("Título é obrigatório.");
  if (titulo.length > LIMITES.titulo) errors.push(`Título deve ter no máximo ${LIMITES.titulo} caracteres.`);

  const tipo = String(body.tipo ?? "").trim();
  if (!isTipoValido(tipo)) errors.push("Tipo de capacitação inválido.");

  let instrutor: string | null = body.instrutor ? String(body.instrutor).trim() : null;
  if (instrutor && instrutor.length > LIMITES.instrutor) {
    errors.push(`Instrutor/tutor deve ter no máximo ${LIMITES.instrutor} caracteres.`);
  }
  if (isTipoValido(tipo) && !tipoTemInstrutor(tipo)) instrutor = null;

  const data_inicio = String(body.data_inicio ?? "").trim();
  const data_fim = String(body.data_fim ?? "").trim();
  if (!isDataValida(data_inicio)) errors.push("Data inicial inválida.");
  if (!isDataValida(data_fim)) errors.push("Data final inválida.");
  if (isDataValida(data_inicio) && isDataValida(data_fim) && data_fim < data_inicio) {
    errors.push("Data final deve ser maior ou igual à data inicial.");
  }

  let numero_participantes: number | null = null;
  const participantesRaw = String(body.numero_participantes ?? "").trim();
  if (participantesRaw !== "") {
    const n = Number(participantesRaw);
    if (!Number.isInteger(n) || n < 0) {
      errors.push("Número de participantes deve ser um inteiro maior ou igual a zero.");
    } else {
      numero_participantes = n;
    }
  }

  return { titulo, tipo, instrutor, data_inicio, data_fim, numero_participantes };
}

export function validarNovaCapacitacao(body: Record<string, unknown>): ValidationResult<NovaCapacitacaoInput> {
  const errors: string[] = [];
  const comuns = validarCamposComuns(body, errors);

  const area = String(body.area ?? "").trim();
  if (!isAreaValida(area)) errors.push("Área responsável inválida.");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data: { ...comuns, area } };
}

export interface EdicaoCapacitacaoInput extends CamposComuns {
  status: "ativa" | "encerrada";
}

export function validarEdicaoCapacitacao(body: Record<string, unknown>): ValidationResult<EdicaoCapacitacaoInput> {
  const errors: string[] = [];
  const comuns = validarCamposComuns(body, errors);

  const status = String(body.status ?? "").trim();
  if (status !== "ativa" && status !== "encerrada") errors.push("Status inválido.");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data: { ...comuns, status: status as "ativa" | "encerrada" } };
}

export interface NovaAvaliacaoInput {
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
}

function validarNota(valor: unknown, campo: string, errors: string[]): number | null {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1 || n > 10) {
    errors.push(`${campo} deve ser uma nota inteira entre 1 e 10.`);
    return null;
  }
  return n;
}

// q5Aplicavel deve vir de uma consulta ao backend sobre a capacitação (nunca do participante).
export function validarNovaAvaliacao(
  body: Record<string, unknown>,
  q5Aplicavel: boolean,
): ValidationResult<NovaAvaliacaoInput> {
  const errors: string[] = [];

  const nome = body.nome ? String(body.nome).trim().slice(0, LIMITES.nome) || null : null;

  let email: string | null = body.email ? String(body.email).trim() : null;
  if (email) {
    if (email.length > LIMITES.email || !isEmailValido(email)) {
      errors.push("E-mail em formato inválido.");
    }
  }

  const tipo_servidor = String(body.tipo_servidor ?? "").trim();
  if (tipo_servidor !== "municipal" && tipo_servidor !== "estadual") {
    errors.push("Tipo de servidor inválido.");
  }

  let municipio: string | null = null;
  let crs: string | null = null;
  if (tipo_servidor === "municipal") {
    municipio = String(body.municipio ?? "").trim();
    if (!isMunicipioValido(municipio)) errors.push("Município é obrigatório e deve ser um município válido do RS.");
  } else if (tipo_servidor === "estadual") {
    crs = String(body.crs ?? "").trim();
    if (!isCrsValido(crs)) errors.push("CRS é obrigatória e deve ser uma opção válida.");
  }

  const formacao = String(body.formacao ?? "").trim();
  if (!["ensino_medio", "tecnico", "superior"].includes(formacao)) errors.push("Formação inválida.");

  let curso: string | null = body.curso ? String(body.curso).trim() : null;
  if (formacao === "tecnico" || formacao === "superior") {
    if (!curso) errors.push("Informe o nome do curso.");
    else if (curso.length > LIMITES.curso) errors.push(`Curso deve ter no máximo ${LIMITES.curso} caracteres.`);
  } else {
    curso = null;
  }

  const q1 = validarNota(body.q1, "Q1", errors);
  const q2 = validarNota(body.q2, "Q2", errors);
  const q3 = validarNota(body.q3, "Q3", errors);
  const q4 = validarNota(body.q4, "Q4", errors);

  let q5: number | null = null;
  if (q5Aplicavel) {
    q5 = validarNota(body.q5, "Q5", errors);
  }

  const tempo = String(body.tempo ?? "").trim();
  if (!["insuficiente", "adequado", "longo"].includes(tempo)) errors.push("Resposta sobre o tempo da capacitação inválida.");

  let comentario: string | null = body.comentario ? String(body.comentario).trim() : null;
  if (comentario) {
    if (comentario.length > LIMITES.comentario) {
      errors.push(`Comentário deve ter no máximo ${LIMITES.comentario} caracteres.`);
    }
  } else {
    comentario = null;
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    data: {
      nome,
      email,
      tipo_servidor: tipo_servidor as "municipal" | "estadual",
      municipio,
      crs,
      formacao: formacao as "ensino_medio" | "tecnico" | "superior",
      curso,
      q1: q1 as number,
      q2: q2 as number,
      q3: q3 as number,
      q4: q4 as number,
      q5,
      tempo: tempo as "insuficiente" | "adequado" | "longo",
      comentario,
    },
  };
}
