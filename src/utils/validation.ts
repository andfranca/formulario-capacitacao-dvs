import { isAreaValida } from "../data/areas";
import { isTipoValido, tipoTemInstrutor } from "../data/tipos";
import { isCrsValido } from "../data/crs";
import { isMunicipioValido } from "../data/municipios-rs";
import type { Pergunta, TipoPergunta } from "../services/perguntas";

export type ValidationResult<T> = { valid: true; data: T } | { valid: false; errors: string[] };

export const LIMITES = {
  titulo: 200,
  instrutor: 150,
  nome: 150,
  email: 254,
  curso: 200,
  perguntaTexto: 500,
  textoLivreResposta: 2000,
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

export interface ParticipanteInput {
  nome: string | null;
  email: string | null;
  tipo_servidor: "municipal" | "estadual";
  municipio: string | null;
  crs: string | null;
  formacao: "ensino_medio" | "tecnico" | "superior";
  curso: string | null;
}

export function validarParticipante(body: Record<string, unknown>): ValidationResult<ParticipanteInput> {
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
    },
  };
}

export interface RespostaInput {
  perguntaId: number;
  valor: string;
}

// perguntas deve conter apenas as perguntas já filtradas como aplicáveis a esta
// capacitação (ativas + regra "somente com instrutor" resolvida pelo backend).
export function validarRespostas(body: Record<string, unknown>, perguntas: Pergunta[]): ValidationResult<RespostaInput[]> {
  const errors: string[] = [];
  const respostas: RespostaInput[] = [];

  for (const p of perguntas) {
    const bruto = body[`pergunta_${p.id}`];

    if (p.tipo === "escala_1_10") {
      if (bruto === undefined || bruto === "") {
        if (p.obrigatoria) errors.push(`"${p.texto}" é obrigatória.`);
        continue;
      }
      const n = Number(bruto);
      if (!Number.isInteger(n) || n < 1 || n > 10) {
        errors.push(`"${p.texto}" deve ser uma nota inteira entre 1 e 10.`);
      } else {
        respostas.push({ perguntaId: p.id, valor: String(n) });
      }
    } else if (p.tipo === "sim_nao") {
      const v = String(bruto ?? "");
      if (!v) {
        if (p.obrigatoria) errors.push(`"${p.texto}" é obrigatória.`);
        continue;
      }
      if (v !== "sim" && v !== "nao") {
        errors.push(`"${p.texto}" é inválida.`);
      } else {
        respostas.push({ perguntaId: p.id, valor: v });
      }
    } else if (p.tipo === "multipla_escolha") {
      const v = String(bruto ?? "");
      if (!v) {
        if (p.obrigatoria) errors.push(`"${p.texto}" é obrigatória.`);
        continue;
      }
      if (!p.opcoes.some((o) => String(o.id) === v)) {
        errors.push(`"${p.texto}" é inválida.`);
      } else {
        respostas.push({ perguntaId: p.id, valor: v });
      }
    } else {
      const v = String(bruto ?? "").trim();
      if (!v) {
        if (p.obrigatoria) errors.push(`"${p.texto}" é obrigatória.`);
        continue;
      }
      if (v.length > LIMITES.textoLivreResposta) {
        errors.push(`"${p.texto}" deve ter no máximo ${LIMITES.textoLivreResposta} caracteres.`);
      } else {
        respostas.push({ perguntaId: p.id, valor: v });
      }
    }
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data: respostas };
}

export interface NovaPerguntaFormInput {
  texto: string;
  tipo: TipoPergunta;
  obrigatoria: boolean;
  somenteComInstrutor: boolean;
  opcoes: string[];
}

const TIPOS_PERGUNTA: TipoPergunta[] = ["escala_1_10", "sim_nao", "multipla_escolha", "texto_livre"];

function isChecked(valor: unknown): boolean {
  return valor === "on" || valor === "true" || valor === "1";
}

export function validarNovaPergunta(body: Record<string, unknown>): ValidationResult<NovaPerguntaFormInput> {
  const errors: string[] = [];

  const texto = String(body.texto ?? "").trim();
  if (!texto) errors.push("Texto da pergunta é obrigatório.");
  if (texto.length > LIMITES.perguntaTexto) errors.push(`Texto da pergunta deve ter no máximo ${LIMITES.perguntaTexto} caracteres.`);

  const tipo = String(body.tipo ?? "").trim() as TipoPergunta;
  if (!TIPOS_PERGUNTA.includes(tipo)) errors.push("Tipo de pergunta inválido.");

  const obrigatoria = isChecked(body.obrigatoria);
  const somenteComInstrutor = isChecked(body.somente_com_instrutor);

  let opcoesTexto: string[] = [];
  if (tipo === "multipla_escolha") {
    opcoesTexto = String(body.opcoes ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (opcoesTexto.length < 2) errors.push("Informe ao menos duas opções, uma por linha.");
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data: { texto, tipo, obrigatoria, somenteComInstrutor, opcoes: opcoesTexto } };
}

export interface EdicaoPerguntaFormInput {
  texto: string;
  obrigatoria: boolean;
  somenteComInstrutor: boolean;
}

export function validarEdicaoPergunta(body: Record<string, unknown>): ValidationResult<EdicaoPerguntaFormInput> {
  const errors: string[] = [];

  const texto = String(body.texto ?? "").trim();
  if (!texto) errors.push("Texto da pergunta é obrigatório.");
  if (texto.length > LIMITES.perguntaTexto) errors.push(`Texto da pergunta deve ter no máximo ${LIMITES.perguntaTexto} caracteres.`);

  const obrigatoria = isChecked(body.obrigatoria);
  const somenteComInstrutor = isChecked(body.somente_com_instrutor);

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data: { texto, obrigatoria, somenteComInstrutor } };
}

export interface NovoCriadorInput {
  nome: string;
  email: string;
  senha: string;
}

const SENHA_MIN_LENGTH = 8;

export function validarNovoCriador(body: Record<string, unknown>): ValidationResult<NovoCriadorInput> {
  const errors: string[] = [];

  const nome = String(body.nome ?? "").trim();
  if (!nome) errors.push("Nome é obrigatório.");
  if (nome.length > LIMITES.nome) errors.push(`Nome deve ter no máximo ${LIMITES.nome} caracteres.`);

  const email = String(body.email ?? "").trim();
  if (!email || !isEmailValido(email) || email.length > LIMITES.email) errors.push("E-mail em formato inválido.");

  const senha = String(body.senha ?? "");
  if (senha.length < SENHA_MIN_LENGTH) errors.push(`Senha deve ter ao menos ${SENHA_MIN_LENGTH} caracteres.`);

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data: { nome, email, senha } };
}
