import { test } from "node:test";
import assert from "node:assert/strict";
import { gerarCsv } from "../src/utils/csv";

test("gerarCsv inclui BOM UTF-8 e cabeçalho", () => {
  const csv = gerarCsv(["nome", "cidade"], [{ nome: "Ana", cidade: "Porto Alegre" }]);
  assert.ok(csv.startsWith("﻿"));
  assert.ok(csv.includes("nome;cidade"));
  assert.ok(csv.includes("Ana;Porto Alegre"));
});

test("gerarCsv escapa campos com ponto e vírgula, aspas ou quebras de linha", () => {
  const csv = gerarCsv(["comentario"], [{ comentario: 'Muito bom; "recomendo"\nobrigado' }]);
  assert.ok(csv.includes('"Muito bom; ""recomendo""\nobrigado"'));
});

test("gerarCsv trata valores nulos/indefinidos como campo vazio", () => {
  const csv = gerarCsv(["a", "b"], [{ a: null, b: undefined }]);
  assert.ok(csv.includes("a;b\r\n;\r\n"));
});
