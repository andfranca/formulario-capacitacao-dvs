import { test } from "node:test";
import assert from "node:assert/strict";
import { gerarHashSenha, verificarSenha } from "../src/services/senha";

test("gerarHashSenha produz um hash que verificarSenha reconhece como válido", async () => {
  const hash = await gerarHashSenha("minhaSenhaForte123");
  assert.equal(await verificarSenha("minhaSenhaForte123", hash), true);
});

test("verificarSenha rejeita senha incorreta", async () => {
  const hash = await gerarHashSenha("minhaSenhaForte123");
  assert.equal(await verificarSenha("senhaErrada", hash), false);
});

test("gerarHashSenha gera salts diferentes para a mesma senha (hashes não devem ser iguais)", async () => {
  const hash1 = await gerarHashSenha("mesmaSenha");
  const hash2 = await gerarHashSenha("mesmaSenha");
  assert.notEqual(hash1.hash, hash2.hash);
  assert.notEqual(hash1.salt, hash2.salt);
  assert.equal(await verificarSenha("mesmaSenha", hash1), true);
  assert.equal(await verificarSenha("mesmaSenha", hash2), true);
});
