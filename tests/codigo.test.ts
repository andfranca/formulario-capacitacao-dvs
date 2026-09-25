import { test } from "node:test";
import assert from "node:assert/strict";
import { formatarDataCodigo, gerarCodigoCandidato, isUniqueConstraintError } from "../src/services/codigo";

test("formatarDataCodigo formata como DDMMAA", () => {
  assert.equal(formatarDataCodigo(new Date(2025, 8, 26)), "260925");
  assert.equal(formatarDataCodigo(new Date(2026, 0, 5)), "050126");
});

test("gerarCodigoCandidato gera o código base na primeira tentativa", () => {
  const data = new Date(2025, 8, 26);
  assert.equal(gerarCodigoCandidato("ALI", data, 1), "ALI-260925");
});

test("gerarCodigoCandidato adiciona sufixo -2, -3 a partir da segunda tentativa", () => {
  const data = new Date(2025, 8, 26);
  assert.equal(gerarCodigoCandidato("ALI", data, 2), "ALI-260925-2");
  assert.equal(gerarCodigoCandidato("ALI", data, 3), "ALI-260925-3");
});

test("isUniqueConstraintError reconhece violação de UNIQUE do D1/SQLite", () => {
  assert.equal(isUniqueConstraintError(new Error("D1_ERROR: UNIQUE constraint failed: capacitacoes.codigo")), true);
  assert.equal(isUniqueConstraintError(new Error("outro erro qualquer")), false);
  assert.equal(isUniqueConstraintError("não é um Error"), false);
});
