import { test } from "node:test";
import assert from "node:assert/strict";
import { media, mediana, distribuicao, taxaResposta, formatarPercentual } from "../src/utils/stats";

test("media calcula a média aritmética", () => {
  assert.equal(media([1, 2, 3, 4]), 2.5);
  assert.equal(media([]), null);
});

test("mediana calcula corretamente com quantidade ímpar e par de valores", () => {
  assert.equal(mediana([1, 3, 2]), 2);
  assert.equal(mediana([1, 2, 3, 4]), 2.5);
  assert.equal(mediana([]), null);
});

test("distribuicao conta ocorrências de cada nota de 1 a 10", () => {
  const dist = distribuicao([1, 1, 10, 5]);
  assert.equal(dist.find((d) => d.nota === 1)?.quantidade, 2);
  assert.equal(dist.find((d) => d.nota === 10)?.quantidade, 1);
  assert.equal(dist.find((d) => d.nota === 5)?.quantidade, 1);
  assert.equal(dist.find((d) => d.nota === 2)?.quantidade, 0);
  assert.equal(dist.length, 10);
});

test("taxaResposta retorna null quando participantes não informado ou zero (evita divisão por zero)", () => {
  assert.equal(taxaResposta(10, null), null);
  assert.equal(taxaResposta(10, 0), null);
  assert.equal(taxaResposta(35, 60), 35 / 60);
});

test("formatarPercentual formata em pt-BR ou 'Não disponível'", () => {
  assert.equal(formatarPercentual(null), "Não disponível");
  assert.equal(formatarPercentual(0.583), "58,3%");
});
