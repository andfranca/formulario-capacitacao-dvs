import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validarNovaCapacitacao,
  validarEdicaoCapacitacao,
  validarParticipante,
  validarRespostas,
  validarNovoCriador,
  validarNovaPergunta,
  validarEdicaoPergunta,
} from "../src/utils/validation";
import type { Pergunta } from "../src/services/perguntas";

const CAPACITACAO_BASE = {
  titulo: "Boas práticas em vigilância sanitária",
  area: "ALI",
  tipo: "expositiva_presencial",
  instrutor: "Fulano de Tal",
  data_inicio: "2026-03-10",
  data_fim: "2026-03-12",
  numero_participantes: "40",
};

test("validarNovaCapacitacao aceita dados válidos", () => {
  const resultado = validarNovaCapacitacao(CAPACITACAO_BASE);
  assert.equal(resultado.valid, true);
});

test("validarNovaCapacitacao rejeita área fora da lista fechada", () => {
  const resultado = validarNovaCapacitacao({ ...CAPACITACAO_BASE, area: "INEXISTENTE" });
  assert.equal(resultado.valid, false);
  if (!resultado.valid) assert.ok(resultado.errors.some((e) => e.includes("Área")));
});

test("validarNovaCapacitacao rejeita tipo fora da lista fechada", () => {
  const resultado = validarNovaCapacitacao({ ...CAPACITACAO_BASE, tipo: "tipo_invalido" });
  assert.equal(resultado.valid, false);
  if (!resultado.valid) assert.ok(resultado.errors.some((e) => e.includes("Tipo")));
});

test("validarNovaCapacitacao rejeita data final anterior à inicial", () => {
  const resultado = validarNovaCapacitacao({ ...CAPACITACAO_BASE, data_inicio: "2026-03-12", data_fim: "2026-03-10" });
  assert.equal(resultado.valid, false);
  if (!resultado.valid) assert.ok(resultado.errors.some((e) => e.includes("Data final")));
});

test("validarNovaCapacitacao remove o instrutor quando o tipo não admite instrutor/tutor", () => {
  const resultado = validarNovaCapacitacao({ ...CAPACITACAO_BASE, tipo: "autoinstrucional_sem_tutor" });
  assert.equal(resultado.valid, true);
  if (resultado.valid) assert.equal(resultado.data.instrutor, null);
});

test("validarNovaCapacitacao aceita número de participantes vazio (a informar depois)", () => {
  const resultado = validarNovaCapacitacao({ ...CAPACITACAO_BASE, numero_participantes: "" });
  assert.equal(resultado.valid, true);
  if (resultado.valid) assert.equal(resultado.data.numero_participantes, null);
});

test("validarEdicaoCapacitacao não exige o campo área (não é editável)", () => {
  const resultado = validarEdicaoCapacitacao({ ...CAPACITACAO_BASE, status: "ativa" });
  assert.equal(resultado.valid, true);
});

test("validarEdicaoCapacitacao rejeita status inválido", () => {
  const resultado = validarEdicaoCapacitacao({ ...CAPACITACAO_BASE, status: "pausada" });
  assert.equal(resultado.valid, false);
});

const PARTICIPANTE_BASE = {
  tipo_servidor: "municipal",
  municipio: "Porto Alegre",
  formacao: "ensino_medio",
};

test("validarParticipante aceita formulário municipal válido", () => {
  const resultado = validarParticipante(PARTICIPANTE_BASE);
  assert.equal(resultado.valid, true);
  if (resultado.valid) {
    assert.equal(resultado.data.municipio, "Porto Alegre");
    assert.equal(resultado.data.crs, null);
  }
});

test("validarParticipante exige município válido do RS quando municipal", () => {
  const resultado = validarParticipante({ ...PARTICIPANTE_BASE, municipio: "Cidade Inexistente" });
  assert.equal(resultado.valid, false);
});

test("validarParticipante aceita formulário estadual válido com CRS", () => {
  const resultado = validarParticipante({ ...PARTICIPANTE_BASE, tipo_servidor: "estadual", municipio: "", crs: "3ª CRS" });
  assert.equal(resultado.valid, true);
  if (resultado.valid) {
    assert.equal(resultado.data.crs, "3ª CRS");
    assert.equal(resultado.data.municipio, null);
  }
});

test("validarParticipante exige CRS válida quando estadual", () => {
  const resultado = validarParticipante({ ...PARTICIPANTE_BASE, tipo_servidor: "estadual", crs: "99ª CRS" });
  assert.equal(resultado.valid, false);
});

test("validarParticipante exige nome do curso quando formação é Técnico ou Superior", () => {
  const semCurso = validarParticipante({ ...PARTICIPANTE_BASE, formacao: "tecnico" });
  assert.equal(semCurso.valid, false);

  const comCurso = validarParticipante({ ...PARTICIPANTE_BASE, formacao: "superior", curso: "Engenharia" });
  assert.equal(comCurso.valid, true);
});

function pergunta(overrides: Partial<Pergunta>): Pergunta {
  return {
    id: 1,
    texto: "Pergunta de teste",
    tipo: "escala_1_10",
    obrigatoria: true,
    somenteComInstrutor: false,
    ativa: true,
    ordem: 1,
    opcoes: [],
    ...overrides,
  };
}

test("validarRespostas valida escala de 1 a 10", () => {
  const p = pergunta({ id: 1, tipo: "escala_1_10" });
  const notaZero = validarRespostas({ pergunta_1: "0" }, [p]);
  assert.equal(notaZero.valid, false);

  const notaOnze = validarRespostas({ pergunta_1: "11" }, [p]);
  assert.equal(notaOnze.valid, false);

  const notaValida = validarRespostas({ pergunta_1: "8" }, [p]);
  assert.equal(notaValida.valid, true);
});

test("validarRespostas ignora pergunta não aplicável (não passada na lista) e não gera erro", () => {
  const resultado = validarRespostas({}, []);
  assert.equal(resultado.valid, true);
  if (resultado.valid) assert.equal(resultado.data.length, 0);
});

test("validarRespostas exige resposta quando a pergunta é obrigatória", () => {
  const p = pergunta({ id: 2, tipo: "texto_livre", obrigatoria: true });
  const resultado = validarRespostas({}, [p]);
  assert.equal(resultado.valid, false);
});

test("validarRespostas aceita pergunta opcional sem resposta", () => {
  const p = pergunta({ id: 3, tipo: "texto_livre", obrigatoria: false });
  const resultado = validarRespostas({}, [p]);
  assert.equal(resultado.valid, true);
  if (resultado.valid) assert.equal(resultado.data.length, 0);
});

test("validarRespostas valida opção de múltipla escolha contra a lista de opções da pergunta", () => {
  const p = pergunta({
    id: 4,
    tipo: "multipla_escolha",
    opcoes: [
      { id: 10, texto: "Insuficiente", ordem: 1 },
      { id: 11, texto: "Adequado", ordem: 2 },
    ],
  });
  const valida = validarRespostas({ pergunta_4: "11" }, [p]);
  assert.equal(valida.valid, true);

  const invalida = validarRespostas({ pergunta_4: "999" }, [p]);
  assert.equal(invalida.valid, false);
});

test("validarNovaPergunta exige ao menos duas opções para múltipla escolha", () => {
  const semOpcoes = validarNovaPergunta({ texto: "Como foi?", tipo: "multipla_escolha", opcoes: "Só uma" });
  assert.equal(semOpcoes.valid, false);

  const comOpcoes = validarNovaPergunta({ texto: "Como foi?", tipo: "multipla_escolha", opcoes: "Ruim\nBom\nÓtimo" });
  assert.equal(comOpcoes.valid, true);
  if (comOpcoes.valid) assert.deepEqual(comOpcoes.data.opcoes, ["Ruim", "Bom", "Ótimo"]);
});

test("validarEdicaoPergunta exige texto não vazio", () => {
  const resultado = validarEdicaoPergunta({ texto: "" });
  assert.equal(resultado.valid, false);
});

test("validarNovoCriador aceita nome, e-mail e senha válidos", () => {
  const resultado = validarNovoCriador({ nome: "Ana Souza", email: "ana@exemplo.com", senha: "senhaForte123" });
  assert.equal(resultado.valid, true);
});

test("validarNovoCriador rejeita e-mail em formato inválido", () => {
  const resultado = validarNovoCriador({ nome: "Ana Souza", email: "nao-e-email", senha: "senhaForte123" });
  assert.equal(resultado.valid, false);
});

test("validarNovoCriador exige senha com pelo menos 8 caracteres", () => {
  const resultado = validarNovoCriador({ nome: "Ana Souza", email: "ana@exemplo.com", senha: "1234567" });
  assert.equal(resultado.valid, false);
});
