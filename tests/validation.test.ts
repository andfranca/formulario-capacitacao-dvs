import { test } from "node:test";
import assert from "node:assert/strict";
import { validarNovaCapacitacao, validarEdicaoCapacitacao, validarNovaAvaliacao } from "../src/utils/validation";

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

const AVALIACAO_BASE = {
  tipo_servidor: "municipal",
  municipio: "Porto Alegre",
  formacao: "ensino_medio",
  q1: "8",
  q2: "9",
  q3: "7",
  q4: "10",
  q5: "9",
  tempo: "adequado",
};

test("validarNovaAvaliacao aceita formulário municipal válido", () => {
  const resultado = validarNovaAvaliacao(AVALIACAO_BASE, true);
  assert.equal(resultado.valid, true);
  if (resultado.valid) {
    assert.equal(resultado.data.municipio, "Porto Alegre");
    assert.equal(resultado.data.crs, null);
  }
});

test("validarNovaAvaliacao exige município válido do RS quando municipal", () => {
  const resultado = validarNovaAvaliacao({ ...AVALIACAO_BASE, municipio: "Cidade Inexistente" }, true);
  assert.equal(resultado.valid, false);
});

test("validarNovaAvaliacao aceita formulário estadual válido com CRS", () => {
  const resultado = validarNovaAvaliacao({ ...AVALIACAO_BASE, tipo_servidor: "estadual", municipio: "", crs: "3ª CRS" }, true);
  assert.equal(resultado.valid, true);
  if (resultado.valid) {
    assert.equal(resultado.data.crs, "3ª CRS");
    assert.equal(resultado.data.municipio, null);
  }
});

test("validarNovaAvaliacao exige CRS válida quando estadual", () => {
  const resultado = validarNovaAvaliacao({ ...AVALIACAO_BASE, tipo_servidor: "estadual", crs: "99ª CRS" }, true);
  assert.equal(resultado.valid, false);
});

test("validarNovaAvaliacao exige nome do curso quando formação é Técnico ou Superior", () => {
  const semCurso = validarNovaAvaliacao({ ...AVALIACAO_BASE, formacao: "tecnico" }, true);
  assert.equal(semCurso.valid, false);

  const comCurso = validarNovaAvaliacao({ ...AVALIACAO_BASE, formacao: "superior", curso: "Engenharia" }, true);
  assert.equal(comCurso.valid, true);
});

test("validarNovaAvaliacao valida escala de 1 a 10 para Q1-Q4", () => {
  const notaZero = validarNovaAvaliacao({ ...AVALIACAO_BASE, q1: "0" }, true);
  assert.equal(notaZero.valid, false);

  const notaOnze = validarNovaAvaliacao({ ...AVALIACAO_BASE, q1: "11" }, true);
  assert.equal(notaOnze.valid, false);
});

test("validarNovaAvaliacao ignora Q5 quando não aplicável (autoinstrucional sem tutor) e mantém null", () => {
  const { q5, ...semQ5 } = AVALIACAO_BASE;
  const resultado = validarNovaAvaliacao(semQ5, false);
  assert.equal(resultado.valid, true);
  if (resultado.valid) assert.equal(resultado.data.q5, null);
});

test("validarNovaAvaliacao exige Q5 entre 1 e 10 quando aplicável", () => {
  const resultado = validarNovaAvaliacao({ ...AVALIACAO_BASE, q5: "" }, true);
  assert.equal(resultado.valid, false);
});
