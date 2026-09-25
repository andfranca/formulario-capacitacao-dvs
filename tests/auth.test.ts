import { test } from "node:test";
import assert from "node:assert/strict";
import { senhaCorreta, criarCookieSessao, sessaoValida } from "../src/services/auth";

test("senhaCorreta compara corretamente senhas iguais e diferentes", () => {
  assert.equal(senhaCorreta("minhasenha123", "minhasenha123"), true);
  assert.equal(senhaCorreta("errada", "minhasenha123"), false);
  assert.equal(senhaCorreta("", "minhasenha123"), false);
});

test("cookie de sessão de admin é válido e carrega o papel correto", async () => {
  const cookie = await criarCookieSessao("segredo-de-teste", { role: "admin" });
  const sessao = await sessaoValida("segredo-de-teste", cookie);
  assert.equal(sessao?.role, "admin");
});

test("cookie de sessão de criador carrega o usuarioId", async () => {
  const cookie = await criarCookieSessao("segredo-de-teste", { role: "criador", usuarioId: 42 });
  const sessao = await sessaoValida("segredo-de-teste", cookie);
  assert.equal(sessao?.role, "criador");
  assert.equal(sessao && "usuarioId" in sessao ? sessao.usuarioId : undefined, 42);
});

test("cookie de sessão é rejeitado com segredo diferente (assinatura inválida)", async () => {
  const cookie = await criarCookieSessao("segredo-de-teste", { role: "admin" });
  assert.equal(await sessaoValida("outro-segredo", cookie), null);
});

test("sessaoValida rejeita cookie ausente ou malformado", async () => {
  assert.equal(await sessaoValida("segredo-de-teste", undefined), null);
  assert.equal(await sessaoValida("segredo-de-teste", "valor-qualquer-sem-ponto"), null);
});
