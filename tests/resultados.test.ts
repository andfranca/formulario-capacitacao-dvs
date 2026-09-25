import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularEstatisticasResultados } from "../src/services/resultados";
import type { AvaliacaoRecord } from "../src/services/avaliacoes";

function avaliacao(overrides: Partial<AvaliacaoRecord>): AvaliacaoRecord {
  return {
    id: 1,
    capacitacao_id: 1,
    nome: null,
    email: null,
    tipo_servidor: "municipal",
    municipio: "Porto Alegre",
    crs: null,
    formacao: "ensino_medio",
    curso: null,
    q1: 8,
    q2: 8,
    q3: 8,
    q4: 8,
    q5: 8,
    tempo: "adequado",
    comentario: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

test("calcularEstatisticasResultados não contabiliza Q5 nula como zero (capacitação sem Q5 aplicável)", () => {
  const avaliacoes = [avaliacao({ q5: null }), avaliacao({ q5: null })];
  const stats = calcularEstatisticasResultados(avaliacoes, false);
  assert.equal(stats.q5, null);
});

test("calcularEstatisticasResultados calcula Q5 apenas com respostas presentes quando aplicável", () => {
  const avaliacoes = [avaliacao({ q5: 10 }), avaliacao({ q5: 6 })];
  const stats = calcularEstatisticasResultados(avaliacoes, true);
  assert.equal(stats.q5?.respostas, 2);
  assert.equal(stats.q5?.media, 8);
});

test("calcularEstatisticasResultados só lista comentários não vazios e identifica participante anônimo", () => {
  const avaliacoes = [
    avaliacao({ nome: "Maria", comentario: "Ótima capacitação" }),
    avaliacao({ nome: null, comentario: "Gostei bastante" }),
    avaliacao({ nome: "João", comentario: "" }),
    avaliacao({ nome: "Pedro", comentario: null }),
  ];
  const stats = calcularEstatisticasResultados(avaliacoes, false);
  assert.equal(stats.comentarios.length, 2);
  assert.equal(stats.comentarios[0].nome, "Maria");
  assert.equal(stats.comentarios[1].nome, "Participante não identificado");
});

test("calcularEstatisticasResultados calcula distribuição de tempo em quantidade e percentual", () => {
  const avaliacoes = [avaliacao({ tempo: "adequado" }), avaliacao({ tempo: "adequado" }), avaliacao({ tempo: "insuficiente" })];
  const stats = calcularEstatisticasResultados(avaliacoes, false);
  const adequado = stats.tempo.find((t) => t.label === "Adequado");
  assert.equal(adequado?.quantidade, 2);
});
