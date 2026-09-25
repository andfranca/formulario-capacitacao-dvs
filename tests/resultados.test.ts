import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularResultadosPerguntas } from "../src/services/resultados";
import type { RespostaBruta } from "../src/services/resultados";
import type { Pergunta } from "../src/services/perguntas";

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

function resposta(overrides: Partial<RespostaBruta>): RespostaBruta {
  return { pergunta_id: 1, valor: "8", nome: null, ...overrides };
}

test("calcularResultadosPerguntas não contabiliza ausência de resposta como zero em escala 1-10", () => {
  const p = pergunta({ id: 5, tipo: "escala_1_10" });
  const resultado = calcularResultadosPerguntas([p], []);
  assert.equal(resultado[0].tipo, "escala_1_10");
  if (resultado[0].tipo === "escala_1_10") {
    assert.equal(resultado[0].totalRespostas, 0);
    assert.equal(resultado[0].media, null);
    assert.equal(resultado[0].mediana, null);
  }
});

test("calcularResultadosPerguntas calcula média/mediana só com as respostas presentes", () => {
  const p = pergunta({ id: 5, tipo: "escala_1_10" });
  const respostas = [resposta({ pergunta_id: 5, valor: "10" }), resposta({ pergunta_id: 5, valor: "6" })];
  const resultado = calcularResultadosPerguntas([p], respostas);
  if (resultado[0].tipo === "escala_1_10") {
    assert.equal(resultado[0].totalRespostas, 2);
    assert.equal(resultado[0].media, 8);
  }
});

test("calcularResultadosPerguntas calcula contagem e percentual para sim_nao", () => {
  const p = pergunta({ id: 6, tipo: "sim_nao" });
  const respostas = [
    resposta({ pergunta_id: 6, valor: "sim" }),
    resposta({ pergunta_id: 6, valor: "sim" }),
    resposta({ pergunta_id: 6, valor: "nao" }),
  ];
  const resultado = calcularResultadosPerguntas([p], respostas);
  if (resultado[0].tipo === "sim_nao") {
    const sim = resultado[0].opcoes.find((o) => o.label === "Sim");
    assert.equal(sim?.quantidade, 2);
    assert.equal(sim?.percentual, "66,7%");
  }
});

test("calcularResultadosPerguntas calcula contagem por opção em multipla_escolha", () => {
  const p = pergunta({
    id: 7,
    tipo: "multipla_escolha",
    opcoes: [
      { id: 101, texto: "Insuficiente", ordem: 1 },
      { id: 102, texto: "Adequado", ordem: 2 },
      { id: 103, texto: "Longo", ordem: 3 },
    ],
  });
  const respostas = [resposta({ pergunta_id: 7, valor: "102" }), resposta({ pergunta_id: 7, valor: "102" }), resposta({ pergunta_id: 7, valor: "101" })];
  const resultado = calcularResultadosPerguntas([p], respostas);
  if (resultado[0].tipo === "multipla_escolha") {
    const adequado = resultado[0].opcoes.find((o) => o.label === "Adequado");
    assert.equal(adequado?.quantidade, 2);
  }
});

test("calcularResultadosPerguntas só lista textos não vazios e identifica participante anônimo", () => {
  const p = pergunta({ id: 8, tipo: "texto_livre", obrigatoria: false });
  const respostas = [
    resposta({ pergunta_id: 8, valor: "Ótima capacitação", nome: "Maria" }),
    resposta({ pergunta_id: 8, valor: "Gostei bastante", nome: null }),
  ];
  const resultado = calcularResultadosPerguntas([p], respostas);
  if (resultado[0].tipo === "texto_livre") {
    assert.equal(resultado[0].textos.length, 2);
    assert.equal(resultado[0].textos[0].nome, "Maria");
    assert.equal(resultado[0].textos[1].nome, "Participante não identificado");
  }
});
