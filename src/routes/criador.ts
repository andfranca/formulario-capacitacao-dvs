import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono";
import type { Env } from "../env";
import { criarCookieSessao, sessaoValida, SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "../services/auth";
import { autenticarCriador } from "../services/usuarios";
import { criarCapacitacao, listarCapacitacoesPorCriador, buscarCapacitacaoDoCriador } from "../services/capacitacoes";
import { validarNovaCapacitacao } from "../utils/validation";
import { paginaLoginCriador, paginaListaCapacitacoesCriador, paginaNovaCapacitacaoCriador, paginaVerCapacitacaoCriador } from "../views/criador";

type CriadorBindings = { Bindings: Env; Variables: { usuarioId: number } };

export const criadorRoutes = new Hono<CriadorBindings>();

criadorRoutes.get("/login", (c) => c.html(paginaLoginCriador()));

criadorRoutes.post("/login", async (c) => {
  const body = await c.req.parseBody();
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const senha = typeof body.senha === "string" ? body.senha : "";

  const usuario = await autenticarCriador(c.env.DB, email, senha);
  if (!usuario) {
    return c.html(paginaLoginCriador("E-mail ou senha incorretos."), 401);
  }

  const cookieValue = await criarCookieSessao(c.env.SESSION_SECRET, { role: "criador", usuarioId: usuario.id });
  setCookie(c, SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === "https:",
    sameSite: "Lax",
    path: "/",
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  });
  return c.redirect("/criador/capacitacoes", 303);
});

criadorRoutes.post("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
  return c.redirect("/criador/login", 303);
});

const exigirCriador: MiddlewareHandler<CriadorBindings> = async (c, next) => {
  const cookieValue = getCookie(c, SESSION_COOKIE_NAME);
  const sessao = await sessaoValida(c.env.SESSION_SECRET, cookieValue);
  if (!sessao || sessao.role !== "criador") {
    return c.redirect("/criador/login", 303);
  }
  c.set("usuarioId", sessao.usuarioId);
  await next();
};

criadorRoutes.use("/capacitacoes", exigirCriador);
criadorRoutes.use("/capacitacoes/*", exigirCriador);

criadorRoutes.get("/capacitacoes", async (c) => {
  const lista = await listarCapacitacoesPorCriador(c.env.DB, c.get("usuarioId"));
  return c.html(paginaListaCapacitacoesCriador(lista));
});

criadorRoutes.get("/capacitacoes/nova", (c) => c.html(paginaNovaCapacitacaoCriador()));

criadorRoutes.post("/capacitacoes", async (c) => {
  const body = (await c.req.parseBody()) as Record<string, unknown>;
  const resultado = validarNovaCapacitacao(body);

  if (!resultado.valid) {
    const valores = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)]));
    return c.html(paginaNovaCapacitacaoCriador({ erros: resultado.errors, valores }), 400);
  }

  const cap = await criarCapacitacao(c.env.DB, resultado.data, c.get("usuarioId"));
  return c.redirect(`/criador/capacitacoes/${cap.id}?criada=1`, 303);
});

criadorRoutes.get("/capacitacoes/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const cap = await buscarCapacitacaoDoCriador(c.env.DB, id, c.get("usuarioId"));
  if (!cap) return c.notFound();

  const link = `${new URL(c.req.url).origin}/avaliar/${encodeURIComponent(cap.codigo)}`;
  const criada = c.req.query("criada") === "1";
  return c.html(paginaVerCapacitacaoCriador(cap, link, criada));
});
