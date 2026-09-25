import { test } from "node:test";
import assert from "node:assert/strict";
import { senhaCorreta, criarCookieSessao, sessaoValida } from "../src/services/auth";

test("senhaCorreta compara corretamente senhas iguais e diferentes", () => {
  assert.equal(senhaCorreta("minhasenha123", "minhasenha123"), true);
  assert.equal(senhaCorreta("errada", "minhasenha123"), false);
  assert.equal(senhaCorreta("", "minhasenha123"), false);
});

test("cookie de sessão gerado é válido para o segredo correto", async () => {
  const cookie = await criarCookieSessao("segredo-de-teste");
  assert.equal(await sessaoValida("segredo-de-teste", cookie), true);
});

test("cookie de sessão é rejeitado com segredo diferente (assinatura inválida)", async () => {
  const cookie = await criarCookieSessao("segredo-de-teste");
  assert.equal(await sessaoValida("outro-segredo", cookie), false);
});

test("sessaoValida rejeita cookie ausente ou malformado", async () => {
  assert.equal(await sessaoValida("segredo-de-teste", undefined), false);
  assert.equal(await sessaoValida("segredo-de-teste", "valor-qualquer-sem-ponto"), false);
});
